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

## 2024-05-03 记2

*Yanray训练手札 2：

手札的所有内容均同步至博客，由于书写语法为MarkDown，为了获得更好的阅读体验，建议去博客阅读：https://blog.eurekac.cn/p/27917125.html

下载了ChatGLM-6B-32K，好在ZhiPuAI把文件都备份到了国内ModelScope上，下载并没有费太多时间。

然后尝试直接用demo的cli_demo.py跑模型，跑是跑起来了，但是推理速度异常缓慢，大概40s左右出一个字。

使用nvtop查看了显卡状态，发现推理时RX直接拉满到480MB/s，仔细检查之后发现默认demo里面加载方式居然是Transformer的.eval()，直接fp32干到显卡里面去跑。而模型在cuda内完全展开要用20GB显存，显卡只有10GB。所以eval用法会把一部分layer卸载到内存中，到需要的时候才会从内存加载。

然而，手头这张P102本身就是老黄阉割的产物，PCIE只有可怜的1.1x4（*雪上加霜的是之前一不小心磨坏了背板上的两颗电容现在只有1.1x2了，理论带宽只有480MB/s）。将layer反复地从内存卸载加载在这张卡上自然出奇的慢。

没办法，只能在之前加上.half().cuda()来尝试以fp16加载显卡中，然后这时候就崩了个`CUDA Out Of Memory`，查询github上的文档后发现fp16也需要13GB的显存。

唯一的方式只能是用官方给的.quantize()方法量化，以更低的精度来加载到显存中。文档上提示INT8的量化允许在8G显存跑推理，9G显存跑微调，刚刚好适用于我的情况。

官方并没有chatglm3-6b-int4量化版本，只能自己量化。根据注释提醒，应当在量化时使用cuda。然而实测这种法子肯定会爆显存，正解应当是先加载到cpu中用cpu做好量化，然后再load到gpu。为了避免反复量化开销，我干脆写了个小脚本单独量化模型并保存起来。

将已经量化好的模型作为模型路径载入cli_demo中，结果崩了个错`can't set attribute 'eos_token'`。好在官仓里面已经有一个close的[issue](https://github.com/THUDM/ChatGLM3/issues/152
)，简单浏览后得知量化保存的时候Transformer会把冗余的参数写入tokenizer的配置文件，但是推理的时候载入冗余参数会出错。只要将原有的仓库中的`tokenizer_config.json`移过去就行了。

最后跑起来了，int8下显存占用7.5G，且性能与colab中使用T4跑的fp16大致相同。由于模型可以整个加载到显存中，实际推理无需通过PCIE交互，推理速度也达到了一个可用的水平。


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
