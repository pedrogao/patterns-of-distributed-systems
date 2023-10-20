import { defineUserConfig, defaultTheme } from "vuepress";

export default defineUserConfig({
  lang: "zh-CN",
  title: "Patterns of Distributed Systems",
  description:
    "《分布式系统模式》（Patterns of Distributed Systems）是 Unmesh Joshi 编写的一系列关于分布式系统实现的文章。这个系列的文章采用模式的格式，介绍了像 Kafka、Zookeeper 这种分布式系统在实现过程采用的通用模式，是学习分布式系统实现的基础。",
  base: "/patterns-of-distributed-systems/",

  theme: defaultTheme({
    logo: "https://martinfowler.com/articles/patterns-of-distributed-systems/card.png",
    repo: "https://github.com/pedrogao/patterns-of-distributed-systems",
    home: "/",

    navbar: [
      {
        text: "主页",
        link: "/",
      },
      {
        text: "概述",
        link: "/content/overview",
      },
      {
        text: "模式",
        children: [
          {
            text: "一致性内核（Consistent Core）",
            link: "/content/consistent-core",
          },
          {
            text: "追随者读取（Follower Reads）",
            link: "/content/follower-reads",
          },
        ],
      },
    ],
  }),
});
