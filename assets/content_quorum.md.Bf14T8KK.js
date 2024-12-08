import{_ as r,c as e,a4 as a,o}from"./chunks/framework.DDPRMxUp.js";const m=JSON.parse('{"title":"Quorum","description":"","frontmatter":{},"headers":[],"relativePath":"content/quorum.md","filePath":"content/quorum.md"}'),d={name:"content/quorum.md"};function l(n,t,u,s,h,i){return o(),e("div",null,t[0]||(t[0]=[a('<h1 id="quorum" tabindex="-1">Quorum <a class="header-anchor" href="#quorum" aria-label="Permalink to &quot;Quorum&quot;">​</a></h1><p><strong>原文</strong></p><p><a href="https://martinfowler.com/articles/patterns-of-distributed-systems/quorum.html" target="_blank" rel="noreferrer">https://martinfowler.com/articles/patterns-of-distributed-systems/quorum.html</a></p><p>每个决策都需要大多数服务器同意，避免两组服务器各自独立做出决策。</p><p><strong>2020.8.11</strong></p><h2 id="问题" tabindex="-1">问题 <a class="header-anchor" href="#问题" aria-label="Permalink to &quot;问题&quot;">​</a></h2><p>在一个分布式系统中，无论服务器采取任何的行动，都要确保即便在发生崩溃的情况下，行动的结果都能够对客户端可用。要做到这一点，可以将结果复制到其它的服务器上。但是，这就引出了一个问题：需要有多少服务器确认了这次复制之后，原来的服务器才能确信这次更新已经完全识别。如果原来的服务器要等待过多的复制，它的响应速度就会降低——也就减少了活跃度。但如果没有足够的复制，更新可能会丢失掉——安全性失效。在整体系统性能和系统连续性之间取得平衡，这一点至关重要。</p><h2 id="解决方案" tabindex="-1">解决方案 <a class="header-anchor" href="#解决方案" aria-label="Permalink to &quot;解决方案&quot;">​</a></h2><p>集群收到一次更新，在集群中的大多数节点确认了这次更新之后，集群才算是确认了这次更新。我们将这个数量称之为 Quorum。因此，如果我们的集群有 5 个节点，我们需要让 Quorum 为 3（对于 n 个节点的集群而言，quorum 是 n/2 + 1）。</p><p>Quorum 的需求表示，可以容忍多少的失效——这就是集群规模减去 Quorum。5 个节点的集群能够容忍其中的 2 个节点失效。总的来说，如果我们想容忍 “f” 个失效，集群的规模应该是 2f + 1。</p><p>考虑下面两个需要 Quorum 的例子：</p><ul><li><strong>更新服务器集群中的数据</strong>。<a href="./high-water-mark.html">高水位标记（High-Water Mark）</a>保证了一点，只有大多数服务器上确保可用的数据才是对客户端可见的。</li><li><strong>领导者选举</strong>。在<a href="./leader-and-followers.html">领导者和追随者（Leader and Followers）</a>模式中，领导者只有得到大多数服务器投票才会当选。</li></ul><h3 id="确定集群中服务器的数量" tabindex="-1">确定集群中服务器的数量 <a class="header-anchor" href="#确定集群中服务器的数量" aria-label="Permalink to &quot;确定集群中服务器的数量&quot;">​</a></h3><p>只有在大部分服务器都在运行时，集群才能发挥其作用。进行数据复制的系统中，有两点需要考虑：</p><ul><li><p>写操作的吞吐</p><p>每次数据写入集群时，都需要复制到多台服务器上。每新增一台服务器都会增加完成这次写入的开销。数据写的延迟直接正比于形成 Quorum 的服务器数量。正如我们将在下面看到的，如果集群中的服务器数量翻倍，吞吐值将会降低到原有集群的一半。</p></li><li><p>能够容忍的失效数量</p><p>能容忍的失效服务器数量取决于集群的规模。但是，向既有集群增加一台服务器并非总能得到更多的容错率：在一个有三台服务器的集群中，增加一台服务器，并不会增加失效容忍度。</p></li></ul><p>考虑到这两个因素，大多数实用的基于 Quorum 的系统集群规模通常是三台或五台。五台服务器集群能够容忍两台服务器失效，其可容忍数据写入的吞吐是每秒几千个请求。</p><p>下面是一个选择服务器数量的例子，根据可容忍的失效数量，以及在吞吐上近似的影响。吞吐一列展示了近似的相对吞吐量，这样就凸显出吞吐量随着服务器数量的增加而降低。这个数字会因系统而异。作为一个例子，读者可以参考在 <a href="https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf" target="_blank" rel="noreferrer">Raft 论文</a>和原始的 <a href="https://www.usenix.org/legacy/event/atc10/tech/full_papers/Hunt.pdf" target="_blank" rel="noreferrer">Zookeeper</a> 论文中公布的实际的吞吐数据。</p><table tabindex="0"><thead><tr><th>服务器的数量</th><th>Quorum</th><th>可容忍的失效数量</th><th>表现的吞吐量</th></tr></thead><tbody><tr><td>1</td><td>1</td><td>0</td><td>100</td></tr><tr><td>2</td><td>2</td><td>0</td><td>85</td></tr><tr><td>3</td><td>2</td><td>1</td><td>82</td></tr><tr><td>4</td><td>3</td><td>1</td><td>57</td></tr><tr><td>5</td><td>3</td><td>2</td><td>48</td></tr><tr><td>6</td><td>4</td><td>2</td><td>41</td></tr><tr><td>7</td><td>5</td><td>3</td><td>36</td></tr></tbody></table><h2 id="示例" tabindex="-1">示例 <a class="header-anchor" href="#示例" aria-label="Permalink to &quot;示例&quot;">​</a></h2><ul><li>所有的共识实现都是基于 Quorum 的，比如，<a href="https://zookeeper.apache.org/doc/r3.4.13/zookeeperInternals.html#sc_atomicBroadcast" target="_blank" rel="noreferrer">Zab</a>、<a href="https://raft.github.io/" target="_blank" rel="noreferrer">Raft</a>、<a href="https://en.wikipedia.org/wiki/Paxos_(computer_science)" target="_blank" rel="noreferrer">Paxos</a>。</li><li>即便是不使用共识的系统，也会使用 Quorum，确保在失效或网络分区的情况下，最新的更新也至少在一台服务器上是可用的。比如，在像 <a href="http://cassandra.apache.org/" target="_blank" rel="noreferrer">Cassandra</a> 这样的数据库里，要配置成只在大多数服务器更新记录成功之后，数据库更新才返回成功。</li></ul>',20)]))}const c=r(d,[["render",l]]);export{m as __pageData,c as default};
