import { defineConfig } from "vitepress";
import subNav from "../pattern-nav.json";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Patterns of Distributed Systems",
  description:
    "《分布式系统模式》（Patterns of Distributed Systems）是 Unmesh Joshi 编写的一系列关于分布式系统实现的文章。这个系列的文章采用模式的格式，介绍了像 Kafka、Zookeeper 这种分布式系统在实现过程采用的通用模式，是学习分布式系统实现的基础。",
  base: "/patterns-of-distributed-systems/",
  lang: "zh-CN",

  // https://vitepress.dev/reference/default-theme-config
  themeConfig: {
    logo: "https://martinfowler.com/articles/patterns-of-distributed-systems/card.png",

    nav: [
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
        items: subNav,
      },
      {
        text: "模式（新）",
        items: [
          {
            text: "High-Water Mark (高水位标记)",
            link: "/part2/Chapter 12. High-Water Mark",
          },
          {
            text: "Idempotent Receiver（幂等接收者）",
            link: "/part2/Chapter 15. Idempotent Receiver",
          },
          {
            text: "Version Vector（版本向量）",
            link: "/part2/Chapter 18. Version Vector",
          },
        ],
      },
    ],

    sidebar: [
      {
        text: "模式",
        items: subNav,
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/pedrogao/patterns-of-distributed-systems",
      },
    ],

    footer: {
      message:
        "Released under the MIT License. Forked from dreamhead/patterns-of-distributed-systems",
      copyright: "Copyright © 2023-present pedrogao",
    },

    search: {
      provider: "local",
    },
  },
});
