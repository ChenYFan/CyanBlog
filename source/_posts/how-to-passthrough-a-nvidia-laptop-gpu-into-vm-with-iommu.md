---
title: 穿透一张笔记本N卡到虚拟机里
abbrlink: 72db8539
date: 2026-02-19 14:06:11
hide: false
tags:
  - Windows
  - IOMMU
  - QEMU
  - VM
  - 显卡穿透
categories:
  - 瞎折腾
cover_image: 'https://i.eurekac.cn/2026/02/19/how-to-passthrough-a-nvidia-laptop-gpu-into-vm-with-iommu.png?_s=88946c86'
---

怎么会有人想把笔记本显卡穿透到虚拟机里？

<!--more-->

!!! warning
    这篇文章的内容是基于Linux系统的（具体来讲笔者使用的系统版本和内核版本是Ubuntu24.04+Linux6.17.0-14）

    Windows下的显卡穿透技术和Linux下的实现方式有很大的不同，本文不涉及Windows平台的显卡穿透技术。


# 前情提要

事实证明，在大学中选用游戏本来做自己外带的主力机是一件非常不明智的选择。

尤其是在我组建主力机和服务器后，游戏本的功能被我逐渐弱化成了外出携带的轻薄本（虽然它并不轻薄）。

尽管游戏本的性能优良，即使使用电池供电，其基本性能也能满足日常使用的需求。

但是，鸡哥本身给电池设计的容量就差强人意（极光Z更是只有47Wh），随着鸡哥年龄增长（3年了），电池健康度也进一步下降到了85%，有效能量更是只有40Wh。

![年纪大了是这样的.jpg](https://i.eurekac.cn/2026/02/19/2089c2a6-4f3d-47d1-b673-be93a868df8f.png?_s=ad242050)

在[很久以前](/p/e73f73cf.html)，我曾将这台笔记本重装成了双系统（Windows+Ubuntu），供电时使用Windows系统，外出时使用Ubuntu。

不得不提，Linux的能耗确实比Windows要小很多，在实际测试中切换为Windows系统时仅能坚持1h20m（三节大课挺不过去的程度），而使用Ubuntu时能大约坚持3h，平均下来能耗大约10w左右。

在经历一段时间评估后，我决定将这台笔记本的Windows系统完全卸载掉，只运行Ubuntu系统。

1. Ubuntu+GNOME这套桌面组合我已经用了近8年了，个人感觉外带日常使用应该没有什么太大问题。
2. 由于我已经组建了自己的Hybrid Wireguard网络，可以以最优的路径远程桌面RDP到我放置在实验室的主力机和服务器上。

但是，我打算在这台服务器上使用QEMU虚拟机来运行Windows系统。是的我知道这听起来很怪，但原因有下：

1. 我通常习惯隔离国产软件到专门的物理机或者虚拟机中（如一众IM、网盘软件），然后使用RDP+WinApps方案直接将程序窗口穿透到主力机上。[^1]
2. 如果笔记本短时间外带，我将直接关闭Qemu虚拟机以延长电池续航，使用远程桌面连接到主力机来使用；长时间外带则通常携带电源适配器，届时就可以直接使用虚拟机了。
3. 我已经确认了我短时间外带通常没有需求用到国产软件，如果非常紧急的情况下使用也可以启用虚拟机
4. 不得不提的一点我测试过裸Windows和Ubuntu+QemuWindows使用电池的功耗。后者甚至比前者续航时间还要略长（大约1h35m），不知道是不是神奇的电源调度发力了。

当我思考完这些问题后，我发现还有一样物品一直被我忽略：我这张3050Laptop要怎么处理？

这里再简单介绍一下笔记本的显示逻辑结构。一般来讲Intel设计笔记本CPU时通常会集成一个核显（iGPU），而独立显卡（dGPU）则通常是由NVIDIA或者AMD提供的。

换句话说一般笔记本都有两张显卡，由于我手头的这台极光Z不支持独显直连，Ubuntu是直接通过Intel的UHD核显输出的。

> 如果你用的笔记本是非常古早非常高端的游戏本，那有可能真的只有一张显卡。这种情况下不建议把唯一显卡穿透进虚拟机。当然如果读者艺高人胆大，在虚拟机里反过来用mstsc远程虚拟机链接（用Windows自带的远程桌面虚拟显卡），或者套娃Warp+LookingGlass反向读取虚拟显卡输出也不是不行。至少笔者觉得如果真的只有一张显卡是没有必要再折腾了。

在之前的双系统方案使用中，这张3050Laptop在Ubuntu下是使用NVIDIA Optimus方案来使用的，即由程序来决定自己要不要调用N卡，否则默认回退到Intel核显来使用。

但在实际使用的时候，这张N卡并没有起什么作用（视频编解码UHD比3050Laptop还要强，而且在组建主力机后我已经没有用这台机子打游戏的需求，大部分桌面ui渲染Ubuntu并没有调用N卡），还凭空添了5W的功耗，放在外面宿主机纯属人嫌狗厌。

欸，那这时候我发现，虚拟机里的windows这不还缺一张显卡用于加速3D和渲染UI吗，与其填一张不支持DX12的VirtIO显卡进去，不如直接把这张3050Laptop穿透进虚拟机里用啊。

!!! warning

    ***独显直连与显示问题***
    
    如果存在独显直连，内置eDP通过一个mux切换器来切换连接到iGPU或者dGPU上。若不存在独显直连，则内置eDP直接连接到iGPU上，dGPU则通过PCIe连接到iGPU上（也就是所谓的Optimus方案）。

    无论是不是独显直连，都不影响将dGPU显卡穿透进虚拟机里使用。差异在于如果笔记本支持独显直连，则可以让笔记本屏幕直接输出虚拟机内的画面（但是通常来讲内置键盘触摸板很难一并穿透进虚拟机中，而且这会带来对宿主机操纵的不便），而且需要OEM开发专门的Linux驱动来支持独显直连的切换（至少鸡哥没有，或者你可以尝试自己找EC的接口）。

    况且这台鸡哥极光Z也不支持独显直连，按照我的使用需求也没有直接输出虚拟机画面的需求（一般使用RDP）。

    另外还要提一点，大部分游戏本/笔记本的外置独显输出口（hdmi/dp）都是从独显直通的。如果将显卡穿透进虚拟机后，外置接口的输出是**虚拟机的画面**而不是宿主机的画面。

    如果你希望将显卡穿透进去还要用**内置显示屏**打游戏，那会非常困难，因为mstsc本身对游戏的支持非常困难，需要在宿主机上直接提取显卡的输出（如LookingGlass）。如果机子本身不支持独显直连，那相当于这张显卡本身不会输出，你还要用个HDMI欺骗器骗显卡输出，再用LookingGlass从显存中捕获输出。就算支持独显直连，也要想办法切换内置的MUX。
    
    总之极其不建议使用内置显示屏显示穿透进虚拟机的显卡输出（无论是否支持独显直连），如果要打游戏那也建议HDMI外接显示器，直接让显卡走物理通道输出虚拟机画面。

    ***为什么不把核显穿透进去？***

    前面提到，这台机子不支持独显直连，内置显示器的输出是直接连接到核显上的，如果把核显穿透进虚拟机里了，宿主机就没法显示了（除非外接显示器）。而独显则是通过PCIe连接到核显上的，穿透独显并不会影响宿主机的显示输出。

    此外，穿透核显显然比穿透独显更麻烦，核显通常和CPU紧密耦合。而独显则是一个相对独立的PCIe设备，穿透起来更简单一些。

    如果读者手头的机子支持独显直连且iommu分组的时候成功把核显踢出成一组，则可以考虑把核显穿透进去。但笔者仍不建议这么做，因为Linux对N卡在日常的利用率显然不如Windows好。

    此外对于笔者（我）而言，将独显穿透进虚拟机还可以在虚拟机关机的时候完全断电独显，进一步降低功耗。

!!! error

    ***好处说完了，坏处呢***
    
    穿透显卡并不是完美的，至少我遇到了一个无法解决的事情：显卡Dynamic Boost失效，功耗最高上限锁死60W（原来可以从CPU那里抢+35W功耗变成95W）。

    具体内容将在下文提及，写在最前面是为了让读者有个心理准备，毕竟显卡穿透技术虽然在服务器上已经非常成熟了，<span class="heimu">但在笔记本上还是有很多未知的坑的。</span>

    
    

# 技术准备

显卡穿透技术[^2]是一种允许虚拟机直接访问物理显卡的技术。

该技术通常应用于服务器中，一般通过IOMMU[^3]+VFIO[^4]技术允许虚拟机直接访问物理显卡，从而实现将显卡这一物理资源分配给虚拟机使用。

当然，能在服务器上使用并**不意味着不能**在PC上使用。一般来讲正常的PC主板都是支持IOMMU，Linux下可以通过检查dmesg日志中是否有`Intel-IOMMU: enabled`或者`AMD-Vi: Interrupt remapping enabled`字样来检查基础iommu功能是否可用。

欸，那笔记本电脑何尝不是一种PC？不妨来检查一下我手头的鸡哥笔记本（Intel i7-12450H+NVIDIA RTX 3050）是否支持IOMMU：

## 开启IOMMU功能

大前提是需要启用电脑虚拟化功能（一般在BIOS里，Intel的叫VT-x，AMD的叫SVM），现代电脑绝大数都支持硬件虚拟化（这是Windows HyperV等虚拟化软件的基础），此处不再赘述。

开启BIOS的选项也在BIOS当中，鸡哥是启用`Chipset - System Agent - Control Iommu Pre-boot Behavior`来开启IOMMU功能的。

Linux下开启IOMMU功能通常需要在内核启动参数里添加`intel_iommu=on`（Intel平台）或者`amd_iommu=on`（AMD平台）。

另外强烈建议再添加一个`iommu=pt`参数（IOMMU Pass-Through），这个参数的作用是告诉内核在启用IOMMU的同时，允许**宿主机设备**直接访问物理内存（而不是和虚拟机设备一样通过IOMMU进行地址转换）。

Ubuntu默认使用GRUB引导的系统，可以编辑`/etc/default/grub`文件，在`GRUB_CMDLINE_LINUX_DEFAULT`变量里添加上述参数，然后运行`sudo update-grub`来更新GRUB配置。

更新后**重启**。

## 检查IOMMU支持

```sh
dmesg | grep -e DMAR -e IOMMU
```

![dmesg查询结果](https://i.eurekac.cn/2026/02/19/904cd049-9996-424b-9588-b3aac48bc36d.png?_s=62e8ac0d)

**IOMMU enabled**就绪。

## IOMMU Group查询

光支持IOMMU还不够，还需要检查一下显卡所在的IOMMU Group是否独立。（因为IOMMU将逻辑上不能分离的设备划分到同一个IOMMU Group里，如果显卡和其他设备在同一个Group里，则无法将显卡单独分配给虚拟机使用，一穿就要整组穿过去）

运行以下bash脚本检查iommu分组情况：

```sh
#!/bin/bash
shopt -s nullglob
for g in $(find /sys/kernel/iommu_groups/* -maxdepth 0 -type d | sort -V); do
    echo "IOMMU Group ${g##*/}:"
    for d in $g/devices/*; do
        echo -e "\t$(lspci -nns ${d##*/})"
    done;
done;
```

![IOMMU Group](https://i.eurekac.cn/2026/02/19/4dc18253-6346-49bd-8c49-2e8fe6390bc3.png?_s=7fc48d4f)

此处我们可以看到待穿透显卡（和音频输出）在Group 14中。同时记下设备id（`10de:25a2`和`10de:2291`）备用。

> 额外的一张Audio device是Nvidia显卡的HDMI音频输出接口，这意味着在之后的穿透中需要开启multi function（多功能）模式来同时穿透显卡和音频设备。

## vfio设备隔离、驱动解除绑定

接下来需要将显卡设备从宿主机的驱动中解绑，并绑定到vfio-pci驱动上。

同理修改`/etc/default/grub`文件，在`GRUB_CMDLINE_LINUX_DEFAULT`变量里添加`vfio-pci.ids=10de:25a2,10de:2291`（设备id）参数。

这里的`vfio-pci.ids`参数的作用是告诉内核在启动时将指定设备id的设备绑定到vfio-pci驱动上，从而实现设备的隔离和穿透。

```sh
root@EurekaCyan-Laptop:/home/cyanfalse# cat /etc/default/grub | grep GRUB_CMDLINE_LINUX_DEFAULT
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash intel_iommu=on iommu=pt vfio-pci.ids=10de:25a2,10de:2291"
```

此外如果宿主机已安装Nvidia驱动或者nouveau驱动，建议将vfio在系统最早期启动`nano /etc/initramfs-tools/modules`：

```sh
vfio
vfio_iommu_type1
vfio_pci ids=10de:25a2,10de:2291 #这里的id记得改成自己的
```

同时可以用Softdep 强制依赖顺序避免vfio-pci和nvidia驱动的冲突`nano /etc/modprobe.d/vfio.conf`：

```sh
softdep nvidia pre: vfio-pci
softdep nouveau pre: vfio-pci
options vfio-pci ids=10de:25a2,10de:2226  #这里的id记得改成自己的
```

如果宿主机只有这一张N卡且宿主机不需要再用到N卡，保险起见可以将两者驱动拉入黑名单`nano /etc/modprobe.d/blacklist-nvidia.conf`：

```sh
blacklist nouveau
options nouveau modeset=0

blacklist nvidia
blacklist nvidia_drm
blacklist nvidia_modeset
```

做完上述工作后运行以下命令更新initramfs和grub：

```sh
sudo update-initramfs -u
sudo update-grub
```

操作完毕后**重启**。输入命令`lspci -nnk -d <设备id>`检查一下显卡设备是否已经被vfio-pci驱动绑定：

```sh
root@EurekaCyan-Laptop:/home/cyanfalse# lspci -nnk -d 10de:25a2
01:00.0 VGA compatible controller [0300]: NVIDIA Corporation GA107M [GeForce RTX 3050 Mobile] [10de:25a2] (rev a1)
        Subsystem: Tongfang Hongkong Limited GA107M [GeForce RTX 3050 Mobile] [1d05:1178]
        Kernel driver in use: vfio-pci
        Kernel modules: nvidiafb, nouveau
root@EurekaCyan-Laptop:/home/cyanfalse# lspci -nnk -d 10de:2291
01:00.1 Audio device [0403]: NVIDIA Corporation Device [10de:2291] (rev a1)
        Subsystem: Tongfang Hongkong Limited Device [1d05:1178]
        Kernel driver in use: vfio-pci
        Kernel modules: snd_hda_intel
```


# Passsssss... Through!

!!! info

    以下教程中使用的是有图形界面的virt-manager工具来创建和管理虚拟机，当然也可以使用命令行工具（比如virsh）来完成同样的操作。

    下述步骤中会同步给出virsh命令行的操作示例。

    另外本文默认已跳过虚拟机安装Windows系统的步骤，直接进入显卡穿透的配置部分。

    在此之前建议：

    0. 务必先在虚拟机中安装VirtIO驱动。
    1. 使用host-passthrough+kvm，以获得最佳兼容性和性能。
    2. 使用q35架构。
    3. 单独在硬盘中划分一个分区来安装Windows系统，然后以raw+VirtIO的方式穿透整块硬盘进去，或者直接穿透一张硬盘给虚拟机以获得最佳性能。
    4. 务必使用**不带安全启动UEFI固件**启动。即`/usr/share/OVMF/OVMF_CODE_4M.fd`，而不是`/usr/share/OVMF/OVMF_CODE.secboot.fd`。也不要使用`SeaBIOS`，UEFI是好文明（
    5. 建议穿透的时候断网或暂停Windows Update。避免莫名其妙打个驱动上去。

    另外建议配置具体的大小核分配方式，避免宿主机将虚拟机大核任务分配到小核。

## 添加PCIE设备

`添加硬件`->`PCI Host Device`，选择之前查询到的显卡设备（通常会有两个，一个是显卡本体，一个是音频输出）。

![添加硬件](https://i.eurekac.cn/2026/02/19/25ff0c3f-fe5e-4bc5-8ae2-9f7d1f0a321b.png?_s=ce0fa541)

> 需要注意，这么添加会导致qemu将两个设备添加到两个不同的虚拟pcie槽位（bus），需要手动修改XML中的bus让两个设备在同一个位置。之后qemu会自动在第一个设备上添加`multifunction="on"`参数。
> 
> 当然，如果没有设置，那就得手动添加多函数设备这一参数了。

使用virsh的话需要`virsh edit <vm-name>`进入XML编辑界面，在`<devices>`标签内添加以下内容：

```xml
<hostdev mode='subsystem' type='pci' managed='yes'>
  <source>
    <address domain='0x0000' bus='0x01' slot='0x00' function='0x0' />
  </source>
  <address type='pci' domain='0x0000' bus='0x06' slot='0x00' function='0x0' multifunction='on' />
</hostdev>
<hostdev mode='subsystem' type='pci' managed='yes'>
  <source>
    <address domain='0x0000' bus='0x01' slot='0x00' function='0x1' />
  </source>
  <address type='pci' domain='0x0000' bus='0x06' slot='0x00' function='0x1' />
</hostdev>
```

其中非source块中的`<address>`标签的`bus`参数需要根据实际情况修改成自己的。

## 可以用了吗？

当你添加进设备后，开机，你会发现设备管理器中多出了一张`Microsoft 基本显示适配器`。

最重要的是，笔记本屁股后面的hdmi能直接输出虚拟机的画面了！

![连接实图](https://i.eurekac.cn/2026/02/19/2e7db751-e279-4356-a330-35a5f26eadd1.png?_s=0c792863)

![屏摄是因为这是当时真的这么传出来了信号](https://i.eurekac.cn/2026/02/19/aa9fbb70-05fd-48b4-ac56-00cdde251f3c.png?_s=c7f357bf)

![屏摄是因为这是当时真的这么传出来了信号](https://i.eurekac.cn/2026/02/19/a351822f-4b16-4a7e-b25d-5be2b7e33ddf.png?_s=4bfa0b1e)

然而，当我欣喜若狂，认为上帝能这么轻松给我给打开一扇窗的时候，我愕然发现会发现他同时也关了一扇门<span class="heimu">，还把窗砸了</span>：

![老登别把窗也给砸了啊👊😭👊](https://i.eurekac.cn/2026/02/19/38a207dc-c7b2-4630-8bf8-01bf5636e150.png?_s=8e415f41)


!!! info

    其实如果放在服务器或者台式机上，穿透的是一张正经的Geforce或者GRID系列显卡，到此已经完结撒花了。

    可惜我穿透的是一张笔记本魔改显卡🫠


## 幽灵一般的Error 43

冷静下来，我们分析一下现状

· 笔记本的物理hdmi接口能输出虚拟机内画面 -> 设备穿透成功，显卡基本功能工作正常
· 输出的画面分辨率很低 -> 使用的是基本显示适配器驱动，显卡官方驱动工作不正常
· 显卡名字从`Microsoft 基本显示适配器`变成了`NVIDIA GeForce RTX 3050 Laptop GPU` -> 显卡被系统和驱动正确识别了，但工作不正常

这时候我们就可以基本断定了，显卡驱动虽然安装成功了，但其并没有正常工作。<span class="heimu">Nvidia，Fuck you。</span>


> 前情提要，以下内容虽然精简而少，但探索过程异常曲折且艰难👊😭👊
>
> 此外，在Windows下排查显卡驱动问题异常痛苦。以下部分问题甚至是我尝试在虚拟机中安装Ubuntu中测试功能后才发现的。
>
> 读者若在通过以下可能的解决问题方案后仍无法解决问题，建议也尝试在Linux环境中排查原因。

### VBIOS问题

这是最浅显的问题，没有之一。Laptop显卡默认vbios是从主板上的ROM直接提供的，其vbios并不是由附着在pcie上的设备自己提供的。

换句话说穿透进虚拟机的笔记本显卡的vbios默认是缺失的[^5]，需要从宿主机中提取：


```sh
mkdir /var/lib/libvirt/roms/
echo 1 > /sys/class/drm/card1/device/rom #启用rom读取
cat /sys/class/drm/card1/device/rom > /var/lib/libvirt/roms/3050_patched.rom
echo 0 > /sys/class/drm/card1/device/rom
```

如果提示`Input/output error`则可能被其他驱动锁定了。考虑到之前已经将显卡绑定到vfio-pci驱动上了，需要要暂时从vfio-pci驱动上解绑显卡


```sh
lspci -nn | grep -i nvidia #查找N卡的pcie位置
echo "0000:01:00.0" | sudo tee /sys/bus/pci/drivers/vfio-pci/unbind #这里的地址需要改成自己的
#...重新提取VBIOS
echo "0000:01:00.0" | sudo tee /sys/bus/pci/drivers/vfio-pci/bind #重新绑定回vfio-pci
```

验证vbios是否有效

```sh
hexdump -C ~/vbios.rom | head -n 1
```

检查最开始的`55 AA`是否存在，如果不存在则需要手动删到`55 AA`开头的位置。

随后，在virt-manager的虚拟机设置里，选择显卡设备，点击`XML`，在`</hostdev>`标签前添加以下内容：

```xml
<rom bar='on' file='/var/lib/libvirt/images/3050_mobile.rom'/>
```

如图所示：

![添加vbios](https://i.eurekac.cn/2026/02/19/ff3a08b1-34e8-40d6-8124-fe260644bff9.png?_s=3c77475b)

使用命令行则同样`virsh edit <vm-name>`进入XML编辑界面，在`<hostdev>`标签内添加上述内容。

这里开机后很大概率会出现权限问题，libvirt默认权限配置非常困难，考虑到仅自己使用，建议修改`/etc/libvirt/qemu.conf`直接关闭AppArmor：

```sh
security_driver = "none" #把这一行的值改成none
```

最后重启libvirt服务`sudo systemctl restart libvirtd`

以及还是不要忘记把vbios的权限改成644 `chmod 644 /var/lib/libvirt/images/3050_mobile.rom`

> 如果你觉得这不安全，可以考虑修改`/etc/apparmor.d/abstractions/libvirt-qemu`，篇幅所限不再展开。

### 虚拟机伪装问题

古早年间，Nvidia为了防止数据中心将Geforce系列显卡用于服务器虚拟化<span class="heimu">以强迫数据中心购买昂贵的Datacenter/Quardo系列，以及额外交一笔vGPU授权费</span>，在驱动中加入了关于虚拟机环境的检测机制，如果检测到当前环境是虚拟机，则会直接拒绝加载驱动并报错Error 43。

尽管Nvidia在465[^6]版本后逐步放弃了对虚拟机的歧视，但为了避免这一潜在因素的影响，可以考虑做一些简单的伪装。通过添加sysinfo和部分feature，加入实体机才有的特征来迷惑驱动。

> 此外，无论如何都要保证acpi、apic和vapic加入，这影响后面的ACPI驱动和中断问题。

```xml
<sysinfo type='smbios'>
    <system>
      <entry name='manufacturer'>MECHREVO</entry>
      <entry name='product'>JiXieGeMing</entry>
    </system>
    <chassis>
      <entry name='manufacturer'>MECHREVO</entry>
    </chassis>
</sysinfo>
<features>
    <acpi/>
    <apic/>
    <hyperv mode='custom'>
      <relaxed state='on'/>
      <vapic state='on'/>
      <spinlocks state='on' retries='8191'/>
      <vendor_id state='on' value='123456789110'/>
    </hyperv>
    <kvm>
      <hidden state='on'/>
    </kvm>
    <vmport state='off'/>
    <smm state='on'/>
    <ioapic driver='kvm'/>
</features>
```

### ResizeBar问题

大部分情况下，OEM会在笔记本内开启ResizeBar功能来提升性能，但若虚拟机默认的 MMIO 窗口太小，驱动程序会出现`找不到足够的地址空间来映射显存`错误。

你可以选择1. 直接在BIOS里关闭ResizeBar功能；2. 扩大虚拟机的MMIO窗口大小来解决这个问题。

通过在`commandline`中添加参数来扩大MMIO窗口大小，需要提前在`domain`中加入`xmlns:qemu='http://libvirt.org/schemas/domain/qemu/1.0'`命名空间声明：

![添加命名空间](https://i.eurekac.cn/2026/02/19/7c5cbc26-afc1-4bf6-b805-21535818ac51.png?_s=eaf0d59f)

随后在`</commandline>`前添加以下内容：

```xml
<qemu:commandline>
    <qemu:arg value='-fw_cfg'/>
    <qemu:arg value='name=opt/ovmf/X-PciMmio64Mb,string=65536'/>
</qemu:commandline>
```

!!! warning

    这两个动作需要在一次编辑中完成，若只添加了命名空间但没有添加`commandline`参数，`virsh`会认为没有使用到命名空间从而自动删掉最开始的声明。

### 关闭Secure Boot

<span class="heimu">怎么，上面的照做了还是炸Error 43了？你是不是没看放在最前面的警告？</span>

当我把上述的问题一一解决之后，Error 43依旧阴魂不散缠绕着我。恼怒之下把虚拟机重装成Ubuntu，重新安装显卡驱动。

显卡驱动自然是一如既往安装上去，但是重启后进入系统，依旧`nvidia-smi`提示`NVML找不到设备`。

直到我翻开`dmesg`日志，我才发现`Operation not permitted`的错误提示，原来是签名没进安全启动导致的。

修改Qemu配置，使用不带安全启动的UEFI固件`/usr/share/OVMF/OVMF_CODE_4M.fd`，重启后Ubuntu下显卡驱动工作一切正常，物理HDMI接口也正常输出。

```xml
<os firmware='efi'>
    <type arch='x86_64' machine='pc-q35-8.2'>hvm</type>
    <firmware>
      <feature enabled='no' name='enrolled-keys'/>
      <feature enabled='no' name='secure-boot'/>
    </firmware>
    <loader readonly='yes' type='pflash'>/usr/share/OVMF/OVMF_CODE_4M.fd</loader>
    <nvram template='/usr/share/OVMF/OVMF_VARS_4M.fd'>/var/lib/libvirt/qemu/nvram/win11_VARS.fd</nvram>
    <bootmenu enable='yes'/>
</os>
```

### ACPI电源问题

尽管Ubuntu下工作一切正常，但在Windows下显卡驱动依旧无法正常工作，错误提示依旧`Error 43` 。<span class="heimu">沟槽的43别再追我了😭</span>

到了这一步我曾一度怀疑是老黄还是故意在Windows驱动下整虚拟机检测，为此我浪费了整一天的时间来尝试避免被驱动检测虚拟机，却还是不了了之。

后来我仔细阅读了蓝天大佬的[Optimus MUXed 笔记本上的 NVIDIA 虚拟机显卡直通](https://lantian.pub/article/modify-computer/laptop-muxed-nvidia-passthrough.lantian/)，文章提到还要提供电池相关的ACPI接口，否则Windows下的Nvidia驱动会因为无法正确识别电源状态而拒绝加载。

对，电池状态！笔记本显卡确实需要一个ACPI电源接口信号来激活，这在之前用魔改笔记本3060显卡的时候我就从贩子那边听说过了，要用专门破解过电源状态的Nvidia驱动才能让显卡工作，但当时我并没有真正理解这个问题的本质。😭

Ubuntu下使用`sudo apt install acpica-tools`安装acpica工具，随后`nano power_fix.asl`创建一个新的ASL文件，输入以下内容，该文件将虚拟一个满电并接入交流电的电池：


```asl
DefinitionBlock ("power_fix.aml", "SSDT", 1, "QUARK ", "PWRFIX", 0x00000001)
{
    Scope (_SB)
    {
        Device (ADP1)
        {
            Name (_HID, "ACPI0003")
            Name (_PCL, Package () { _SB })
            Method (_PSR, 0, NotSerialized) { Return (0x01) } // 0x01 = 已插入电源
            Method (_DSM, 4, NotSerialized)
            {
                If (LEqual (Arg0, ToUUID ("7a3a6a8a-40d5-4b5b-9d51-4d1a012a6f23"))) //这一串uuid是从鸡哥ACPI中电源函数中读取的，实际上并没有用（起作用的是底下的NVDR函数，貌似要配合EC，但虚拟机没法穿透EC，因为宿主机要用，这一块问题还没有解决）。
                {
                    Return (Buffer (One) { 0x03 }) // 强制返回性能模式 (0x03)
                }
                Return (Buffer (One) { 0x00 })
            }
        }
        Device (BAT0)
        {
            Name (_HID, EisaId ("PNP0C0A"))
            Name (_UID, 0x01)
            Name (_PCL, Package () { _SB })
            Method (_STA, 0, NotSerialized) { Return (0x1F) }

            Method (_BIF, 0, NotSerialized)
            {
                Return (Package () {
                    0x01, 0x1770, 0x1770, 0x01, 0x36B0, 
                    0x01F4, 0x0064, 0x0064, 0x0064, 
                    "Virtual", "11451", "LION", "OEM"
                })
            }
            Method (_BST, 0, NotSerialized)
            {
                Return (Package () { 0x00, 0x00, 0x1770, 0x36B0 })
            }
        }
        Device (NPCF)
        {
            Name (_HID, "NVDA0001")
            Method (NPCF, 4, Serialized)
            {
                // 无论驱动请求什么索引，都返回 0x01 (代表允许加速/不受限)
                Return (Buffer (One) { 0x01 })
            }
        }
        Device (NVDR)
        {
            Name (_HID, "NVDA0000")
            Method (_DSM, 4, NotSerialized)
            {
                // 常见的 NVIDIA 移动端回调，返回 0x03 开启狂暴模式.
                Return (Buffer (One) { 0x03 })
            }
        }
    }
}
```

随后使用`iasl power_fix.asl`编译成aml文件，将编译后的`power_fix.aml`放到`/var/lib/libvirt/images/`目录下，并在虚拟机的最后qemucommandline参数里添加以下内容：   

```xml
<qemu:arg value='-acpitable'/>
 <qemu:arg value='file=/var/lib/libvirt/images/power_fix.aml'/>
```

最后的配置应该如下：

![Qemu Command](https://i.eurekac.cn/2026/02/19/fe25f096-d747-4b0f-a7c7-677e3d896434.png?_s=00ee08a3)

最终在并入ACPI补丁后，windows内显卡终于不再炸Error 43了，HDMI能输出正常虚拟机内画面，任务管理器内也能看到显卡：

![OhYeah](https://i.eurekac.cn/2026/02/19/97ceabb5-3493-41a7-8701-f81e1b919e65.png?_s=629ed74a)

*终于折磨结束了，感恩😭🙏*

## 一些不必要的步骤

### 不要安装任何Error43修复补丁

这种修复补丁一般是用于将显卡通过OcuLink/M2转PCIE的方式连接到笔记本的M2上，由于显卡插在一些奇怪的接口上，N卡驱动不认，这些补丁通过破解驱动，让N卡驱动不再检查接口类型。

不过在465驱动后，Nvidia也逐步放宽对这一行为限制。通常来讲用560及以上版本不会出现以上问题。

此外，部分补丁还会通过劫持ACPI接口的方式来伪装电源状态，这会加剧之前提到的ACPI电源问题，在笔者之前尝试的时候不得不重装系统来移除这一补丁。

### 如果使用LookingGlass读取显存输出，建议移除Qemu自带显卡。

Windows默认输出环境会选择一个已经连接到显示器的显卡，这很有可能导致Windows会优先选择从Qemu虚拟的显卡中输出，而不是从穿透进虚拟机的独显中输出。

如果你和我一样使用mstsc来连接到虚拟机，则可选移除。实测中Windows会优先选择穿透进虚拟机的独显来加速渲染，另外你还可以安装[Nvidia官方的OpenGL RDP加速补丁](https://developer.nvidia.com/nvidia-opengl-rdp)来让独显加速OpenGL渲染。(需要Nvidia账户登录)

## 电源问题

**本文待续...**



[^1]: 在此之前，笔记本的双系统就是用来跑这个的。如果卸载掉了Windows而使用Ubuntu，尽管Ubuntu可以有各类方案来运行这些软件，我用的这些国产软件大部分也提供了Linux版本，但我还是期望有个容器或者虚拟机来隔离这些流氓软件。
[^2]: 全称GPU Passthrough。这是一类技术的总称，具体实现方式有很多种，比如VFIO、SR-IOV等。广义上来讲n卡自己的vGPU技术也可以算是一种显卡穿透技术。但是vGPU是专门为GRID系列设计的，而且存在付费授权，还需要破解驱动。此外相对于直通pcie设备，性能损耗极大。不适合用于我这块笔记本的3050显卡上。
[^3]: 全称Input-Output Memory Management Unit。IOMMU是一种硬件技术，允许操作系统直接访问物理设备的内存地址（宿主机只计算地址偏移），几乎没有性能损耗。
[^4]: 全称Virtual Function I/O。VFIO是一种Linux内核框架，允许用户空间程序直接访问物理设备（比如显卡）。VFIO依赖于IOMMU技术来实现安全的设备访问。
[^5]: 参考资料[知乎：一次失败的显卡硬件穿透实验](https://zhuanlan.zhihu.com/p/270241023)和[Arch Linux - 使用OVMF直通PCI](https://wiki.archlinuxcn.org/wiki/%E4%BD%BF%E7%94%A8_OVMF_%E7%9B%B4%E9%80%9A_PCI#%E8%AE%BE%E7%BD%AE_OVMF_%E8%99%9A%E6%8B%9F%E6%9C%BA)
[^6]: [GeForce GPU Passthrough for Windows Virtual Machine](https://nvidia.custhelp.com/app/answers/detail/a_id/5173)