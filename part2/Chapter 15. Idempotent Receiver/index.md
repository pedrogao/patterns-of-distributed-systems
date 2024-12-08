# Idempotent Receiver（幂等接收者，幂等处理）

对客户端请求进行唯一标识，这样当客户端重试时，就能忽略重复请求。

## 问题

客户端向服务器发送请求，可能收不到响应。客户端无法感知是响应丢了，还是服务器在处理请求前就崩溃了。  
为确保请求得到处理，客户端不得不重新发送请求。

如果服务器已经处理了该请求，而后崩溃了，那么当客户端重试时，服务器就会收到来自客户端的重复请求。

::: tip
这里的术语有点学术化。

本质上，要在分布式场景下实现请求幂等性，如 RPC 请求，在消费者 GC、宕机、重启的情况下都有可能出现重复请求
消费者要保证同一次请求拿到同样的结果
:::

## 解决方案

::: info

### 至多一次、至少一次和恰好一次操作（At-most once, At-least once，Exactly Once）

根据客户端与服务器交互的方式，服务器必须承诺确切的请求语义。

如果客户端在发送请求之后、收到响应之前遇到故障，可能会出现三种情况。

如果客户端在出现故障的情况下不重试请求，那么服务器可能已经处理了该请求，也可能在处理请求前就出现故障了。
因此，服务器对该请求至多处理一次。

如果客户端重试请求，且服务器在通信故障前已经处理过该请求，那么它可能会再次处理该请求。
因此，服务器对该请求至少处理一次，但也可能会多次处理该请求。

借助幂等接收方，即便客户端多次重试，服务器也只会处理该请求一次。因此，要实现 “恰好一次” 的操作，拥有幂等接收者是很重要的。
:::

为每个客户端分配唯一 ID 来对客户端进行唯一标识。在发送任何请求之前，客户端需先向服务器进行注册。

```java{10}
class ConsistentCoreClient {
    private void registerWithLeader() {
        RequestOrResponse request
            = new RequestOrResponse(RequestId.RegisterClientRequest.getId(), correlationId.incrementAndGet());

        // blockingSend will attempt to create a new connection if there is a network error.
        RequestOrResponse response = blockingSend(request);
        RegisterClientResponse registerClientResponse = JsonSerDes.deserialize(response.getMessageBodyJson(),
            RegisterClientResponse.class);
        this.clientId = registerClientResponse.getClientId();
    }
}
```

当服务器收到客户端注册请求时，它会为该客户端分配一个唯一的请求 ID。
如果服务器是一个一致性核心服务（Consistent Core），它可以使用预写式日志（WAL）索引作为客户端 ID。

```java{9}
class ReplicatedKVStore {

    private Map<Long, Session> clientSessions = new ConcurrentHashMap<>();

    private RegisterClientResponse registerClient(WALEntry walEntry) {

        Long clientId = walEntry.getEntryIndex();
        //clientId to store client responses.
        clientSessions.put(clientId, new Session(clock.nanoTime()));

        return new RegisterClientResponse(clientId);
    }
}
```

服务器创建一个会话，用于存储已注册客户端请求所对应的响应。
它还会追踪会话创建的时间，以便后面，将不活跃的会话丢弃。

```java{22}
public class Session {
  long lastAccessTimestamp;
  Queue<Response> clientResponses = new ArrayDeque<>();

  public Session(long lastAccessTimestamp) {
    this.lastAccessTimestamp = lastAccessTimestamp;
  }

  public long getLastAccessTimestamp() {
    return lastAccessTimestamp;
  }

  public Optional<Response> getResponse(int requestNumber) {
    return clientResponses.stream().
         filter(r -> requestNumber == r.getRequestNumber()).findFirst();
  }

  private static final int MAX_SAVED_RESPONSES = 5;

  public void addResponse(Response response) {
    if (clientResponses.size() == MAX_SAVED_RESPONSES) {
       clientResponses.remove(); //remove the oldest request
    }
    clientResponses.add(response);
  }

  public void refresh(long nanoTime) {
    this.lastAccessTimestamp = nanoTime;
  }
}
```

对于一致性服务而言，客户端注册请求也会作为一致性算法的一部分进行复制。  
因此，即便当前的领导者出现故障，客户端注册信息仍然可用。  
随后，服务器其它节点仍会会存储客户端响应，并在后续请求中返回。

::: info

### 幂等请求和非幂等请求

需要注意的是，有些请求从本质上来说是天然幂等的。例如，在键值存储中设置一个键和一个值，这本身就是幂等操作。即便多次设置相同的键和值，也不会产生问题。

另一方面，创建租约（Lease）就不是幂等操作。如果租约已经创建，重试创建租约的请求将会失败。  
这是个问题，考虑以下场景：  
客户端发送创建租约的请求，服务器成功创建了租约，但随后崩溃了，或者在将响应发送给客户端之前连接出现故障。客户端重新建立连接，并再次尝试创建租约；由于服务器已经存在具有给定名称的租约，它会返回一个错误。这样一来，客户端就会认为自己没有租约。这显然不是我们期望出现的行为。

借助幂等接收者，客户端会使用相同的请求 ID 发送租约请求。因为已处理请求响应保存在服务器上，所以会返回相同的响应。  
这样，如果客户端在连接故障前能够成功创建租约，那么在重试后仍能收到响应。

:::

对于服务器接收到的每一个非幂等请求，在成功执行后，它都会将响应存储在客户端会话中。

```java
class ReplicatedKVStore {

    private Response applyRegisterLeaseCommand(WALEntry walEntry, RegisterLeaseCommand command) {
        logger.info("Creating lease with id " + command.getName()
            + "with timeout " + command.getTimeout()
            + " on server " + getReplicatedLog().getServerId());

        try {
            leaseTracker.addLease(command.getName(), command.getTimeout());
            Response success = Response.success(walEntry.getEntryIndex());
            if (command.hasClientId()) {
                Session session = clientSessions.get(command.getClientId());
                session.addResponse(success.withRequestNumber(command.getRequestNumber()));
            }
            return success;

        } catch (DuplicateLeaseException e) {
            return Response.error(DUPLICATE_LEASE_ERROR, e.getMessage(), walEntry.getEntryIndex());
        }
    }
}
```

客户端在请求时，会设置请求 ID，然后发送给服务端。
客户端还会设置一个计数器，以便为发送给服务器的每一个请求分配 ID。

```java{9}
class ConsistentCoreClient {

    int nextRequestNumber = 1;

    public void registerLease(String name, Duration ttl) throws DuplicateLeaseException {
        RegisterLeaseRequest registerLeaseRequest
            = new RegisterLeaseRequest(clientId, nextRequestNumber, name, ttl.toNanos());

        nextRequestNumber++; // increment request number for next request.

        var serializedRequest = serialize(registerLeaseRequest);

        logger.info("Sending RegisterLeaseRequest for " + name);
        RequestOrResponse requestOrResponse = blockingSendWithRetries(serializedRequest);
        Response response = JsonSerDes.deserialize(requestOrResponse.getMessageBodyJson(), Response.class);
        if (response.error == Errors.DUPLICATE_LEASE_ERROR) {
            throw new DuplicateLeaseException(name);
        }

    }

    private static final int MAX_RETRIES = 3;

    private RequestOrResponse blockingSendWithRetries(RequestOrResponse request) {
        for (int i = 0; i <= MAX_RETRIES; i++) {
            try {
                // blockingSend will attempt to create a new connection is there is no connection.
                return blockingSend(request);
            } catch (NetworkException e) {
                resetConnectionToLeader();
                logger.error("Failed sending request  " + request + ". Try " + i, e);
            }
        }

        throw new NetworkException("Timed out after " + MAX_RETRIES + " retries");
    }
}
```

当服务器收到请求时，它会根据客户端 ID 和请求 ID，检查请求是否已经被处理过。
如果它找到了已保存的响应，就会把相同的响应返回给客户端，而不会再次处理该请求。

```java
class ReplicatedKVStore {

    private Response applyWalEntry(WALEntry walEntry) {
        Command command = deserialize(walEntry);
        if (command.hasClientId()) {
            Session session = clientSessions.get(command.getClientId());
            Optional<Response> savedResponse = session.getResponse(command.getRequestNumber());
            if(savedResponse.isPresent()) {
                return savedResponse.get();
            } // else continue and execute this command.
        }
    }
}
```

## 客户端请求过期处理

每个客户端的请求响应不能永远保存下去。有多种方式可以使这些请求过期。  
在 [RAFT](https://github.com/logcabin/logcabin) 的实现中，客户端会单独记录一个数字，用于标明已成功收到响应的请求 ID。  
随后，这个数字会随每个请求一起发送给服务器。  
服务器可以安全地丢弃任何请求 ID 小于这个数字的响应了。

如果能确保客户端只有在收到前一个请求的响应后才发送下一个请求，那么一旦服务器收到客户端发来的新请求，它就可以安全地删除所有之前的响应了。  
但在使用请求流水线（Request Pipeline）时会存在一个问题，因为可能会有多个正在传输的请求，而客户端可能尚未收到这些请求的响应。  
如果服务器知道一个客户端最多可以有多少个正在传输的请求，它就可以只存储这么多的响应，并删除所有其他响应。

例如，[Kafka](https://kafka.apache.org/)的生产者最多可以有五个正在传输的请求，所以它最多存储之前的五个响应。

```java{5,6}
class Session {
    private static final int MAX_SAVED_RESPONSES = 5;

    public void addResponse(Response response) {
        if (clientResponses.size()== MAX_SAVED_RESPONSES) {
            clientResponses.remove(); // remove the oldest request
        }
        clientResponses.add(response);
    }
}
```

## 移除已注册客户端

::: warning  
需要注意的是，这种检测重复消息的机制仅适用于因连接故障而重试的客户端。  
如果客户端出现故障并重启，它将会再次进行注册（客户端 ID 会变），所以在客户端重启的情况下无法实现去重操作。

而且这种机制并不感知任何应用层逻辑。
因此，如果一个应用程序发送了多个在应用层面重复的请求，服务器无法知晓这一情况。  
应用程序需要自行处理这种情况。
:::

客户端的会话不会永远保存在服务器上。  
服务器可以为客户端会话设置最长存活时间。客户端会向服务器定期发送心跳（HeartBeat）。  
如果在这段时间内没有收到来自客户端的心跳信号，那么服务器会移除该客户端的状态。

服务器会启动一个定时任务，定期检查过期的会话并移除那些已过期的会话。

```java
class ReplicatedKVStore {

    private long heartBeatIntervalMs = TimeUnit.SECONDS.toMillis(10);
    private long sessionTimeoutNanos = TimeUnit.MINUTES.toNanos(5);

    private void startSessionCheckerTask() {
        scheduledTask = executor.scheduleWithFixedDelay(()->{
            removeExpiredSession();
        }, heartBeatIntervalMs, heartBeatIntervalMs, TimeUnit.MILLISECONDS);
    }

    private void removeExpiredSession() {
        long now = System.nanoTime();
        for (Long clientId : clientSessions.keySet()) {
                Session session = clientSessions.get(clientId);
                long elapsedNanosSinceLastAccess = now - session.getLastAccessTimestamp();
                if (elapsedNanosSinceLastAccess > sessionTimeoutNanos) {
                    clientSessions.remove(clientId);
                }
        }
    }
}
```

## 例子

[Raft](https://github.com/logcabin/logcabin)实现了请求幂等性，并提供了线性一致性操作。

[Kafka](https://kafka.apache.org/)允许[生产者幂等](https://cwiki.apache.org/confluence/display/KAFKA/Idempotent+Producer)地重试请求并且自动忽略掉重复请求。

[Zookeeper](https://zookeeper.apache.org/) 有 “会话（Sessions）” 以及 “事务 ID（zxid）” 的设计，这些设计能让客户端在崩溃后恢复，并正常工作。  
HBase 有一个通过 Zookeeper 实现的[恢复组件包装器](https://docs.cloudera.com/HDPDocuments/HDP2/HDP-2.4.0/bk_hbase_java_api/org/apache/hadoop/hbase/zookeeper/RecoverableZooKeeper.xhtml)，它会按照 [Zookeeper 错误处理](https://cwiki.apache.org/confluence/display/ZOOKEEPER/ErrorHandling)方式来实现幂等操作。
