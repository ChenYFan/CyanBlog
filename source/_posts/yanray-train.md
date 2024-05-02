---
title: Yanray训练手札
date: 2024-05-02 18:37:24
tags:
- LLM
- 微调模型
categories:
  - 随心扯
---

记录训练Yanray的一部分想法。

> 该文章会长期更新。

<!-- more -->

## 2024-05-02 记1
其实很早就有自己定制一个AI Assitant的想法了，大约22年3.5刚出的时候就幻想自己做一个Virtual GirlFriend。可惜当时忙着应付考试，也就止步于幻想。

所有的LLM（Large Language Model）本质上都是文本预测器，是在预测一段文本接下来会输出什么。而不论ChatGPT、Claude还是ChatGLM、Qwen，追根到底都是让模型预测一段文本中“Assistant”会说什么。本质上输入模型的格式都是如下所示：

```
System: You are an assitant.Your name is Yanray. 
User: <|input|>
Assitant: <|output|>
```

input为用户输入的问题，模型只要补齐在这段对话里面Assitant会输出什么就行了，然后Filter单独把模型的输出作为output截出来，包装好丢给api出口，在用户看起来，就是一个聊天机器人。

事实上做一个属于自己的AI Assitant很简单，也不需要太大的资源。我的最初的设想是一个比较小巧（6B-13B）的LLM作为一个主模型，合理使用各类工具API加持（比如浏览器、计算器之类）。只要给LLM一些最基本的语言逻辑，还要“教”会LLM输出指定的格式能够被Filter检测并调用，并且LLM要会正确读取Filter返回的数据即可。例如：

```
System: `/calculate` can use calculate tools
User: pls calculate 6.5*7.5
```

模型只要能正确输出`/calculate 6.5*7.5`，Filter就能拦截命令，直接计算数据，然后补齐在对话内：

```
<<...
Assitant: /calculate 6.5*7.5
Tools: 48.75
Assitant: Result is 48.75
```

包括让模型上网都可以用这种简单的方式实现。不过据我之前随手查询的资料，langchain貌似已经很好的做到了这一点。今天把手头的B事处理完之后去看一下langchain部署的难易度，如果实在麻烦不如直接将使用方式作为prompt丢给模型，“教”它简单使用就行，反正做Yanray就是给自己爽的，没必要用什么很高大上的东西。

目前计划采用的主模型是ChatGLM3-6B-32K，主要是够小，压着精度能够跑在我P102上，而且如果可以的话用LLaMA Factory在本机上跑微调或者Lora，10G虽然够呛，P102算力也难绷，但是能跑就行。
