# 《分布式系统模式》中文版

[《分布式系统模式》（Patterns of Distributed Systems）](https://martinfowler.com/articles/patterns-of-distributed-systems/)是 [Unmesh Joshi](https://twitter.com/unmeshjoshi) 编写的一系列关于分布式系统实现的文章。这个系列的文章采用模式的格式，介绍了像 Kafka、Zookeeper 这种分布式系统在实现过程采用的通用模式，是学习分布式系统实现的基础。

## 目录

[概述](content/overview.md)

### 模式

* 以时钟为限的等待（Clock-Bound Wait）
* [一致性内核（Consistent Core）](content/consistent-core.md)
* 新生领导者（Emergent Leader）
* 固定分区（Fixed Partitions）
* [追随者读取（Follower Reads）](content/follower-reads.md)
* [世代时钟（Generation Clock）](content/generation-clock.md)
* [Gossip 传播（Gossip Dissemination）](content/gossip-dissemination.md)
* [心跳（HeartBeat）](content/heartbeat.md)
* [高水位标记（High-Water Mark）](content/high-water-mark.md)
* [混合时钟（Hybrid Clock）](content/hybrid-clock.md)
* [幂等接收者（Idempotent Receiver）](content/idempotent-receiver.md)
* 键值范围分区（Key-Range Partitions）
* [Lamport 时钟（Lamport Clock）](content/lamport-clock.md)
* [领导者和追随者（Leader and Followers）](content/leader-and-followers.md)
* [租约（Lease）](content/lease.md)
* [低水位标记（Low-Water Mark）](content/low-water-mark.md)
* [Paxos](content/paxos.md)
* [Quorum](content/quorum.md)
* [复制日志（Replicated Log）](content/replicated-log.md)
* 批量请求（Request Batch）
* [请求管道（Request Pipeline）](content/request-pipeline.md)
* 请求等待列表（Request Waiting List）
* [分段日志（Segmented Log）](content/segmented-log.md)
* [单一 Socket 通道（Single Socket Channel）](content/single-socket-channel.md)
* [单一更新队列（Singular Update Queue）](content/singular-update-queue.md)
* [状态监控（State Watch）](content/state-watch.md)
* [两阶段提交（Two Phase Commit）](content/two-phase-commit.md)
* [版本向量（Version Vector）](content/version-vector.md)
* [有版本的值（Versioned Values）](content/versioned-value.md)
* [预写日志（Write-Ahead Log）](content/write-ahead-log.md)

## 术语表

| 英文             | 翻译           |
| ---------------- | -------------- |
| durability       | 持久性         |
| Write-Ahead Log  | 预写日志       |
| append           | 追加           |
| hash             | 哈希           |
| replicate        | 复制           |
| failure          | 失效           |
| partition        | 分区           |
| HeartBeat        | 心跳           |
| Quorum           | Quorum         |
| Leader           | 领导者         |
| Follower         | 追随者         |
| High Water Mark  | 高水位标记     |
| Low Water Mark   | 低水位标记     |
| entry            | 条目           |
| propagate        | 传播           |
| disconnect       | 失联、断开连接 |
| Generation Clock | 世代时钟       |
| group membership | 分组成员       |
| partitions       | 分区          |
| liveness         | 活跃情况       |
| round trip       | 往返          |
| in-flight        | 在途          |
| time to live     | 存活时间       |
| head of line blocking | 队首阻塞  |
| coordinator      | 协调者        |
| lag              | 滞后          |
| fanout           | 扇出          |
| incoming         | 传入          |
| CommitIndex      | 提交索引       |
| candidate        | 候选者        |

