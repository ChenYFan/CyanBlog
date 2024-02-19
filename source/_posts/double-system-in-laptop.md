---
title: 笔记本安装Ubuntu+Win10双系统疑难杂症记录
tags:
  - 双系统
  - Ubuntu
  - 驱动
  - 疑难杂症
categories:
  - 解疑惑
abbrlink: e73f73cf
cover_image: https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/banner.jpg
date: 2023-08-21 10:42:01
---

入手一台鸡哥笔记本，折腾双系统，记录一下关于AX101网卡和N卡驱动引起的各种问题。

<!-- more -->

---

芜湖！两朝荒芜，今日割草！

手中4699入了一台机械革命极光Z的笔记本，i5-12450H 32G+1T 3050 作为一台中等级别的游戏本还是比较划算的。尽管12450为残血，3050为甜品卡，但是对于我这种不玩大作游戏的人来说，性能还是足够的。

本着折腾的心态，尝试给这台机子加装上ubuntu。因为有着对服务器硬盘装双系统的经验，本以为装机过程是轻松加愉快，没想到扯出这么多问题。

## 安装

首先现有系统关闭Bitlocker（不然之后有够你受的）

```Shell
manage-bde -off C:
manage-bde -off D:
```

前往 计算机管理-磁盘管理 压缩卷
将D盘割出131072MB(128GB) 作为闲置卷，不格式化 不挂载

![割盘操作](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(6).png)

从[Ubuntu Dekstop Download](https://cn.ubuntu.com/desktop)下载22.04LTS版本
因为本来是打算硬盘安装，于是将压出来的128GB中割了8GB作为安装盘，格式化为exFAT或FAT32（UEFI无法从NTFS引导），直接将iso解压到里头。

重启，鸡哥的机子通常是按F2进入BIOS。

![BIOS](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(1).jpg)

进入BIOS后优先关闭SecureBoot，然后尝试改变引导的时候才发现鸡哥bios太老了，没有`Boot From File`选项。

![SecureBoot](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(2).jpg)

满头大~~汉~~汗翻了个8GB的U盘（还不支持USB3.0的古董U）回来，一套格式化+写入。

由于鸡哥的引导优先级中`USB Device`是排在`NVME Device`上的，所以在插入u盘的时候优先从u盘引导，进入熟悉的Ubuntu加载页面。

~~然后被USB2.0的20MB/s写入卡了三分钟~~

修改镜像为tuna源，将割出来的120GB分区给挂载到`/`下。五分钟不到安装完毕。

安装完毕后别急着直接关机，先修改grub引导为console再重启。

因为据我安装服务器的经验来谈，grub启动时若加载N卡驱动则由grub引导的windows一定会出现花屏问题。

`Ctrl+Alt+T`打开终端，`nano /etc/default/grub.cfg`修改grub配置文件：

```cfg
GRUB_TERMINAL=console
```

加入后保存退出,`update-grub`更新

`reboot`重启时，机子关机关到一半突然卡住，tty无法切换，CAD连招也失效，推测应该是N卡驱动问题，长按电源键强制关机。

## 将启动引导改为Grub

Windows默认是不会识别Ubuntu引导的，而修改windows引导过于麻烦。不如直接将默认引导改为grub，由grub启动windows。

鸡哥由于bios过老，修改方式比较脑瘫，从`UEFI NVME Drive BBS Priorities`进入，将第一个启动项改为ubuntu即可。

![Boot](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(3).jpg)
![Boot](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(4).jpg)


重启，能正常进入grub引导，记下第三个为Windows Boot Manager（id为2），尝试分别进入Windows和ubuntu均无太大问题

![SecureBoot](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(5).jpg)

## 解决蛋疼的无线网卡问题

进入ubuntu的时候，尝试打开浏览器却提示无网络链接，心里不由得咯噔一下。

好在手头还有一个已经破解了的中兴微随身wifi，尝试插入能够被识别为有线网卡，利用随身wifi全功能后台中的wifi中转功能连上了家中路由器。

![SecureBoot](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(1).png)

略微浏览之后发现是AX101网卡驱动没装，于是满怀信心地前往intel linux驱动下载，结果却发现，只有20系，没有10系的网卡驱动。

~~这就肥肠、肥肠抽象了~~

AX101卡是Intel wifi6系列卡中最~~垃圾~~入门的一款，仅有600Mbps理论速率。虽然对于我来说已经完全足够需求（毕竟我在现实中就没连过哪个网速超过500Mbps的网络）了，但是连官网都没有linux驱动支持，心态，不由得发生了一内内变化。

百度上查了一圈，基本文不对题，最后在知乎站内搜索找到了[解决方案](https://www.zhihu.com/question/586002680/answer/3128720014)，但在系统内核安装的时候又出现了亿点点小坑。

首先前往[内核下载](https://kernel.ubuntu.com/~kernel-ppa/mainline/)，选择`6.1.15`

> 尽管是**及以上**，但是实测6.2版本会error，其余更高的未测试

![SecureBoot](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(7).png)

将红框内的内核全部下载，然后

```shell
dpkg -i *.deb
update-grub
```

重启，使6.1.15内核加载到系统中。

但是如果你是从更高的版本降下来的话，那你还要考虑卸载高版本。

```shell
dpkg --list | grep linux-image
dpkg --list | grep linux-headers
```

通过上述命令列出所有的image和header，然后用`apt-get purge`命令清除

当你尝试清除最高版本的kernel时，系统可能会建议你中断当前操作，因为可能会造成系统不稳定。这时候选择`No`(不Abort卸载过程)，完成卸载后`reboot`重启。重新进入后输入 `uname -r`则会发现系统内核已被降级到6.1.15。

`apt install git`，安装git后，先安装makedeb：

```shell
bash -ci "$(wget -qO - 'https://shlink.makedeb.org/install')"
```

克隆并打包`iwlwifi-ax101-dkms`项目：

```shell
git clone 'https://mpr.makedeb.org/iwlwifi-ax101-dkms'
cd iwlwifi-ax101-dkms/
makedeb -si
```

注意不要以root身份运行。完成后会提示提权，此时切换到root安装驱动包：

```shell
dpkg -i iwlwifi-ax101-dkms_6.1.15-2_amd64.deb
```

重启后wifi应当可用。

![SecureBoot](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(2).png)

## Ubuntu关机时假死 - N卡驱动问题

由于之前没有安装N卡驱动，导致电脑关机时会突然卡在徽标页面，加载圈也不转，~~所以之前的关机一直都是强制关机~~

由于不太喜欢自带的额外驱动程序安装，所以还是用传统的官网驱动。

[老黄家走一趟](https://www.nvidia.cn/Download/index.aspx)，下载下来一个run文件。此时要关闭X server在tty中使用

`Ctrl+Alt+F3`切换到tty模式，输入账户密码登录。

首先要清除ubuntu安装中有可能打上去的莫名其妙的驱动，以及安装必要的库

```shell
apt-get update
apt-get remove --purge nvidia*
apt-get install dkms build-essential linux-headers-generic
```

然后拉黑nouveau，`nano /etc/modprobe.d/blacklist-nouveau.conf`输入以下内容

```
blacklist nouveau
blacklist lbm-nouveau
options nouveau modeset=0
alias nouveau off
alias lbm-nouveau off
```

并禁用nouveau：

```shell
echo options nouveau modeset=0 | sudo tee -a /etc/modprobe.d/nouveau-kms.conf
update-initramfs -u
```

重启，同样进入tty模式，先暂停图形服务

```shell
service gdm stop #or lightdm
```

然后懒人`bash *.run`开始安装。

### 题外话：一不小心用了Nvidia驱动的XConf导致进不去系统怎么办

多半是当老黄问你要不要换成由Nvidia驱动X服务的时候手欠选了Yes(然而这里默认是no)

```
Would you like to run the nvidia-xconfig utility to automatically update your X 
configuration file so that the NVIDIA X driver will be used when you restart X? 
Any pre-existing X configuration file will be backed up.
Yes   No
```

~~你看老黄都知道大概率会出问题还给你贴心备份了来着~~

此时别瞎几把听网上说的卸载n卡驱动，重启进入grub时，选择recovery mode，root模式，恢复被老黄改过的XConf即可

```shell
cd /etc/X11/
rm -rf xorg.conf
mv nvidia-xconfig-original.conf  xorg.conf
```

重启即可，关机卡死问题也被成功解决

### 题外话：更新内核导致掉驱动怎么解决

老黄在安装驱动的时候会问你要不要安装dkms，在内核更新的时候自动更新。

没有选yes问题也不大，先`apt install dkms`，

再看一眼当前版本`ls -l /usr/src/`

手动安装`dkms install -m nvidia -v 5xx.xx.xxx`

## 安装蓝牙驱动

这个还算是小问题，首先`dmesg`瞅一眼哪报错了。

![dmesg](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(3).png)

提示无法启动1050蓝牙驱动。

这个时候我第一时间想到的是安装`bluez`这玩意，直到我看到了[Ubuntu22.04 在零刻EQ12 安装蓝牙无法启动问题](https://zhuanlan.zhihu.com/p/628772433)，他告诉我，可以直接复制一份同系列的intel驱动。

咳，虽然比较阴间，不过对我这台鸡哥也是可行的。

![bluetooth](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(4).png)


## 其他一些小优化

### 系统默认进入Windows

已安装Windows后再安装ubuntu，grub的默认启动会优先进入ubuntu。

修改`/etc/default/grub.cfg`，将`GRUB_DEFAULT`改为`Windows Boot Manager`的id（正常情况下为2）

```shell
GRUB_DEFAULT=2
```

### Ubuntu下挂载Windows NTFS盘

安装依赖`sudo apt install nfs-kernel-server fuse`

先`fdisk -l`瞅一眼自己的盘在哪个分区，然后用`mount`挂载

```shell
mount -t ntfs /dev/sdxx /Windows/D
```

`/Windows/D`即windows下D盘内容，建议用chmod提权写入。


至于Windows下挂载ext4，用ext2fsd险些给我盘挂坏...win下挂载很麻烦，又因为是同一块盘没法用wsl挂载。windows下挂载还是先晾着有空再来解决。

### Ubuntu与Windows时间差

老生长谈的问题，22.04可以直接强制改为本地时间而避免时区错误`timedatectl set-local-rtc 1 --adjust-system-clock`


---

除个草，浇浇水(
截个图，留个纪念

![ALL](https://registry.npmmirror.com/chenyfan-os/0.0.0-r26/files/img%20(5).png)

