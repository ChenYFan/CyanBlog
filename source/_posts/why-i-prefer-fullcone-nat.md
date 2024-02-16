---
title: 为什么我更想要FullCone网络
author: ChenYFan
tags:
  - 网络
  - NAT
  - 内网穿透
  - 黑科技
categories:
  - 随心扯
des: 利用FullCone，在不支付高昂独立ip费用的情况下，实现内网穿透
key: 'FullCone,FullCone nat,standard ip'
hide: true
cover_image: 'https://registry.npmmirror.com/chenyfan-os/0.0.0-r17/files/main.jpg'
abbrlink: daa17206
date: 2024-02-15 20:15:42
---

FullCone是什么？我是如何利用FullCone网络实现内网穿透的？为什么我会这么希望得到全锥网络？

<!--more-->

寒假的时候几个高中同学凑一块，想联机玩Minecraft。然而我们几个同学都没有公网ip，想要联机必须要内网穿透。

> 为什么不用IPV6？因为除了我之外其他人的路由器都是NAT在光猫下，而光猫并不支持在NAT中分配IPV6。

传统内网穿透，本质上是用户之间无法直接连接，只能通过一台大家都能连上的服务器互相转发流量，达到穿透的目的。

显而易见，这种方式的互联受限于服务器的带宽和延迟，而且为了转发流量而单独购买一台服务器并不值得。

有没有一种方式，能让两个相互处于NAT网络的用户直接连接，而不需要服务器转发流量呢？

在这之前，我们不妨回过头来，聊聊生活中司空见惯的NAT技术。

## What is NAT

NAT(Network Address Translation)是网络地址转换的缩写，是一种将私有网络地址转换为公有网络地址的技术，诞生的目的是为了解决IPv4地址不足的问题。其解决方案是将多个设备处于一个局域网内，通过共享一个公网ip地址来访问外部网络。

一个传统的网络链接，本质上是两个（ip地址:端口）之间的通讯。NAT通过类似中间人的方式，转发了（公网ip:端口）和（内网ip:端口）之间的通讯。

![]()

不妨用我访问`https://baidu.com`的过程来举例：

0. 路由器通过拨号上网，获取到了一个公网ip地址`39.0.0.1`。路由器网关为`192.168.1.0`，我的电脑ip为`192.168.1.1`。
1. 浏览器通过DNS解析获取到百度的ip为`110.242.68.66`，由于我采用`https`，故默认访问端口为`443`，则目标pair为`110.242.68.66:443`
2. 浏览器通过网卡，查询到本机ip为`192.168.1.1`，并在本地打开了一个临时端口`12345`，将数据包发送给网关`192.168.1.0`
3. 路由器接收到来自`192.168.1.1:12345 -> 110.242.68.66:443`的请求。
4. 路由器在本地打开了一个临时端口`54321`，将请求改写为`39.0.0.1:54321 -> 110.242.68.66:443`，并将请求数据包发送给百度服务器。同时，路由器在本地记录了这个pair的映射关系`39.0.0.1:54321 -> 192.168.1.1:12345`。
5. 路由器接收到来自百度的返回消息`110.242.68.66:443 -> 39.0.0.1:54321`，通过查询映射关系，将返回消息改写为`110.242.68.66:443 -> 192.168.1.1:12345`，并发送给`192.168.1.1`。

通过NAT技术，处在内网的用户能够主动向外部网络发起请求，并且由于路由器保持了映射关系，外部网络也能够向内网发送数据。

但是，在这一情况下外部网络并不能主动向内网发起请求。由于外部网络发出请求数据后，路由表内并没有对应的pair映射关系，路由器并不知晓将外部请求转发给哪个内网用户，会直接丢弃。这就造成了内网用户可以主动链接外部网络，而外部网络却不能主动链接内网用户的局面。

别急，让我们重新审视一下这个过程中最关键的部分：**路由器在本地记录了映射关系**，这才能允许外网向内网发送数据。

如果想要达到外网主动链接内网的目的，由于映射关系只能通过内网用户发起请求或者路由器主动打开，我们的思路应该着重于如何主动获取并保持这个映射关系。

映射关系在内网用户主动发起请求的时候建立，而销毁映射关系的策略略有不同。由于TCP链接为有状态的链接，路由器会在链接主动关闭时自动销毁映射关系。而UDP链接则不同，由于UDP链接是无状态的，路由器并不知晓何时销毁映射关系，只能通过一定的策略来销毁。这一策略通常是在一段时间内没有数据包通过时销毁映射关系。换句话说，在建立映射关系后，只要不断地发送心跳包，这一映射关系就能够一直保持。

回头来看，这一问题的解决方案就显而易见了，在建立一个请求后通过不断发送心跳包，欺骗路由器，使其保持映射关系，就能够实现外网主动链接内网的目的。

...吗？

## NAT has 4 main type

回头来看，事情的解决好像变得太过于简单了。固然，映射关系能够使发送至`39.0.0.1:54321`的数据包转发到`192.168.1.1:12345`，在百度的视角来看，我就像是拥有了公网ip，能够主动向`39.0.0.1:54321`发送信息。

然而，NAT技术很早就考虑到了这一点。映射关系的存在固然能够使外网主动链接内网，但这使得内网用户的（ip地址:端口）彻底暴露在了外网之中。而NAT的本身是局域网，起到了与外部网络隔离的作用，这种暴露方式即不优雅，也不安全。

至此，NAT根据转发策略和限制映射关系访问的方式，分为了4种类型（RFC3489）：

- FullCone 全锥，映射对能够被任意外部网络访问（也被称为NAT A）
- RestrictedCone 限制锥，映射对仅能被映射目标ip访问（丢弃除了来自`110.242.68.66`的所有数据包）
- PortRestrictedCone 端口限制锥，映射对仅能被映射目标ip和端口访问（丢弃除了来自`110.242.68.66:443`的所有数据包）
- Symmetric 对称，映射对仅能被映射目标ip和端口访问，并且当目的地ip和端口不同时，映射对也会不同（即使内网ip:端口是相同的）

其中 全锥、限制锥、端口限制锥 最大的特征是同一个（内网ip:端口）的映射请求会被映射为相同的（公网ip:端口），无论目的地ip和端口是什么。而 对称 则会在目的地ip和端口不同时映射为不同的（公网ip:端口）。

你可以用Python的pystun3来测试你的NAT类型：

```shell
pip install pystun3
pystun3
pystun3 -H stun.qq.com #国内用户可以指定qq的stun服务器以加快测试速度
```

返回数据应该如下：

```
NAT Type: Full Cone
External IP: 39.0.0.1
External Port: 12463
```

## Lets have a try - to build up a server with FullCone NAT

知道了原理，不来试试怎么加深理解呢？

首先，以下操作需要一个拥有全锥NAT的网络环境。如果没有你可以看下一节内容尝试将自己的家庭网络改造为全锥NAT。

此外，需要一台拥有公网ip的服务器，以便于本地计算机能够探测出映射关系。

接下来，我将展示两个脚本，通过运行脚本，本地计算机能够探测出映射关系并在映射对上建立一个临时服务器，如果外部网络能够通过探测出来的映射对访问到这个临时服务器，那么就能证明FullCone内网穿透理论可行。

```javascript
//server.js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  const ip = req.connection.remoteAddress.match(/\d+\.\d+\.\d+\.\d+/)[0];
  const port = req.connection.remotePort;
  console.log(`Request from ${ip}:${port}`);
  setInterval(() => {
    try {
      const req = http.request({
        host: ip,
        port: port,
        method: 'GET'
      })
      req.end();
    } catch (e) { }
  }, 1000); //该定时器会每秒向客户端发送一个请求，使得映射关系不会因为长时间没有通信而被销毁，从而实现锁定映射关系
  res.end(JSON.stringify({ ip, port }));
}).listen(13000);
```

```javascript
//client.js
const http = require('http');
const localPort = 18000; //这是本地即将暴露的端口
const endpoint_url = '' //这是部署了server.js的服务器的ip地址
const endpoint_port = 13000 //这是部署了server.js的服务器的端口
const req = http.request({
    host: endpoint_url,
    port: endpoint_port,
    method: 'GET',
    localPort: localPort //http.request可以通过localPort参数强制指定本地端口
}, (res) => {
    res.on('data', (data) => {
        const { ip, port } = JSON.parse(data.toString());
        console.log(`127.0.0.1:${localPort} -> ${ip}:${port}`);
        console.log(`http://${ip}:${port}`);
        http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Working at ${new Date()}`);
        }).listen(localPort); //通过server.js探测到映射对，然后在本地启动一个服务器，外网访问ip:port会被映射到本地的localPort，从而实现了内网穿透
    })
});
req.end();
```

先运行server.js，然后填入服务器的ip，再运行client.js，控制台内有如下输出

```
127.0.0.1:18000 -> 39.1.1.1:12433
http://39.1.1.1:12433
```

脚本将会自动在`0.0.0.0:18000`启动一个测试服务器，我们直接点击链接访问`http://39.1.1.1:12433`

![]()

如果显示了信息，说明我们的`127.0.0.1:18000`已经成功地被穿透到了`39.1.1.1:12433`。

并且，将`http://39.1.1.1:12433`分享给其他人，他们也能够访问到你的本地服务器。

请注意，从头到尾我并没有声明我拥有公网ip，事实上，无论是否为公网ip，只要nat类型为FullCone，都可以利用这种方式穿透。

使用FullCone穿透的地址可以直接被外网访问，其优点在于流量无需服务器中转，最终的访问是点对点的，目标用户是直接访问到内网的服务器，延迟和速率不受限制。探测服务器仅用于辅助内网用户获取到自己链路上的映射对，本身不参与网络连接。并且网络上存在大量的免费探测服务器，不一定需要自己搭建的服务器。

缺点也十分明显，映射对本身需要长时间的心跳包才能维持，一旦映射长时间无数据包通过，映射就会被断掉，并且重新映射的端口不固定。此外，如果作为长期暴露在公网上供他人访问，还是需要有其他方法将探测到的映射对共享出去（类似DDNS）。

## STUN - A formal protocol to detect NAT pair

事实上，上面的脚本只是一个简单的例子。然而，RFC5389定义了一种更加正式的协议，[STUN(Session Traversal Utilities for NAT)](https://zh.wikipedia.org/wiki/STUN)。STUN协议定义了一种用于检测NAT类型和获取映射对的协议，其探测协议为UDP。由于基于UDP的探测对不会在断开连接后立刻销毁，STUN协议能够有更大的成功率实现NAT互联。

> 需要注意的是，部分路由器在建立映射对的时候也会限制协议。如果内网内用户用UDP探测，则部分路由器只会允许UDP协议的映射对，而不会允许TCP数据包通过映射对。反之亦然。
>
> 如同上面的Demo中，我利用TCP协议来探测映射对，因此外网只能用TCP协议（HTTP协议基于TCP）访问到我的内网服务器，而外网服务器尝试向映射对发送UDP数据包，路由器则会直接丢弃。
> 
> 然而，我们可以将TCP包装在UDP之中，从而绕过这一限制。这一技术被称为TCP over UDP。
>
> 从另一方面讲，基于UDP的VPN协议并不罕见，通过STUN打洞后完全可以建立一个基于UDP的虚拟局域网用于传递TCP数据包，例如传统的Wireguard协议。
> 
> 此外，STUN可以利用TCP作为探测协议，但是在实际网络环境中并非所有NAT均为全锥NAT，因此TCP探测的成功率并不高。

这是标准（RFC 3489）中的利用STUN来探测映射对和NAT类型的过程：

![]()

---

## NAT2NAT - If we all can't get a Public IP

上面所讲述的内容，都是在拥有FullCone的前提下，内网穿透了自己的ip到公网上。然而在大多数使用场景内，我们并不需要把自己的ip暴露在公网上，而是需要两个内网用户之间能够直接链接。

而NAT2NAT技术可以很好的解决这一问题，N2N并不依赖于FullCone就可以尝试在两个NAT用户间“打洞”，使得两个内网用户“直接”互相链接，无需经过服务器转发。

> 然而，拥有FullCone的打洞成功率接近100%，而其他类型的NAT打洞成功率则相对较低。

这是一张表，阐述了不同类型NAT之间一般能否成功打洞

| NAT类型 | FullCone | RestrictedCone | PortRestrictedCone | Symmetric |
| --- | --- | --- | --- | --- |
| FullCone | √ | √ | √ | √ |
| RestrictedCone | √ | √ | √ | √ |
| PortRestrictedCone | √ | √ | √ | X |
| Symmetric | √ | √ | X | X |

> 打洞的成功率由大至小依次为：FullCone > RestrictedCone > PortRestrictedCone > Symmetric。一般由打洞成功率高的NAT向打洞成功率低的NAT发起打洞请求，使弱势用户能够主动链接强势用户，便于弱势用户提前强势用户建立映射对。
> 
> 受限锥-受限锥 受限端锥-受限端锥 需要任意一方在探测完后及时主动向对方发起链接，避免映射对被销毁。
> 
> 对称型-端口受限锥型NAT之间的打洞成功率极低。(1/65535)。
> 
> 而对称型NAT之间的打洞成功率几乎为0。(1/65535^2)

[Ntop的N2N项目](https://github.com/ntop/n2n) 则是一个基于以上理论的开源项目，通过区分Edge(Client)和SuperNode(Server)的方式，方便了普通人的部署。

由于映射对本身只能在内网用户主动向外请求时才能建立，故如何将获取到的映射对及时传递给对方，是N2N的关键。而SuperNode在此时起到了关键作用，SuperNode会记录下所有Edge的映射对并分享给对方，使得两个Edge能够及时知晓对方的映射对，从而建立联系。

正常情况下，SuperNode并不参与数据传输，仅用于告知双方的映射对。然而，在双方NAT打洞成功率不高时，SuperNode也会回退为[TURN模式](https://zh.wikipedia.org/wiki/TURN)（即传统方式，利用服务器转发流量，篇幅所限不再赘述）。

Linux用户可以直接下载[N2N的二进制文件](https://github.com/ntop/n2n/releases)，Windows与Mac用户则需要自行编译或使用第三方编译好的二进制文件。

对于我在Windows上的使用，我通常用[ [灵工艺] 联机组网](https://nullcraft.org/d/39-%E5%85%8D%E8%B4%B9-%E7%81%B5%E5%B7%A5%E8%89%BA%E7%BD%91%E4%B8%8A%E9%82%BB%E5%B1%85-nullcraft-n2n)。其有GUI可以快捷配置，并且也很方便安装TAP适配器。~~主要是懒的敲命令行~~

首先搭建N2N需要有一台拥有公网ip的服务器，然后在服务器上运行SuperNode。尽管SuperNode正常情况下不参与数据传输，但是N2N无法主动禁用TURN模式，故不建议公开部署SuperNode。

搭建SuperNode可以直接安装N2N的二进制文件，配置文件存在`/etc/n2n/supernode.conf`

```conf
# /etc/n2n/supernode.conf
-p=1234
```

运行`sudo systemctl start supernode`即可启动SuperNode，监听端口为1234。

如果需要开机自启动，可以运行`sudo systemctl enable supernode`。

如果当前运行环境（如Docker环境）不存在`systemctl`，可以自行下载N2N的项目源代码并自行编译：

```shell
git clone https://github.com/ntop/n2n.git --depth=1
bash ./autogen.sh
bash ./configure
make
make install
```

然后采用`./supernode`的方式运行。

针对Edge，可以直接运行二进制文件：

```shell
sudo edge -c mynetwork -k mysecretpass -a 192.168.100.1 -f -l supernode.ntop.org:7777
```

- `-c` 指定的链接组名，所有拥有相同链接组名的Edge会被视为同一组
- `-k` 指定的链接组密码
- `-a` 指定的内网ip
- `-l` 指定SuperNode的ip和端口

在另一台Edge上运行：

```shell
sudo edge -c mynetwork -k mysecretpass -a 192.168.100.2 -f -l supernode.ntop.org:7777
```

两台Edge将会自动建立链接，SuperNode会记录下两台Edge的映射对并分享给对方，使得两台Edge能够及时知晓对方的映射对，从而建立联系。

可以尝试在内网ip为`192.168.100.1`的Edge上运行：

```shell
ping 192.168.100.2
```

应当会有相应的回应。

`Ctrl+C`退出后，可以看到类似的输出：

```
**********************************
 Packet stats:
       TX P2P: 10 pkts
       RX P2P: 10 pkts
       TX Supernode: 4 pkts (2 broadcast)
       RX Supernode: 2 pkts (1 broadcast)
**********************************
```

其中`TX P2P`和`RX P2P`表示Edge之间的数据传输，`TX Supernode`和`RX Supernode`表示Edge与SuperNode的数据传输。

SuperNode的数据包应该远小于Edge之间的数据包，因为SuperNode仅用于告知双方的映射对，以及刚开始来不及打洞时通过`TURN`的数据传输。

如果经过一段时间后，`P2P`的数据包数仍然为0，说明N2N的打洞失败，应检查双方防火墙情况和NAT类型。

> **Tips:**
> 
> N2N的SuperNode默认允许了所有Edge的加入。尽管N2N官方有着[专门的鉴权方式](https://github.com/ntop/n2n/blob/dev/doc/Authentication.md)，但是配置及其麻烦，可以巧用[限制通讯组](https://github.com/ntop/n2n/blob/dev/doc/Communities.md)的方式，约定一个确定的通讯组名，限制只有拥有相同通讯组名的Edge才能加入。
> 
> 修改`/etc/n2n/supernode.conf`，添加`-c`参数：
>
> ```conf
> # /etc/n2n/supernode.conf
> -p=1234
> -c=/etc/n2n/communities.list
> ```
>
> 然后在`/etc/n2n/communities.list`中添加通讯组名(允许采用正则表达式，一行一个)：
>
> ```
> mynetwork
> ```
>
> 重启SuperNode `sudo systemctl restart supernode` 即可生效。

## How to Transform Home networks to get FullCone NAT

> 如果你已经拥有了公网IPV4，那么请直接略过这一节。

### Disable Firewall

控制面板进入`高级安全 Windows Defender 防火墙`，在入站规则添加规则，**允许**所有端口的`UDP`。在出站规则中也如法炮制。

> 为了安全性你也可以限定端口范围，但是这样会降低打洞成功率。
>
> 你不需要允许TCP协议，因为N2N默认采用的STUN探测协议为UDP。

![]()

如果你使用的是第三方防火墙，也请关闭防火墙或者添加规则。

### Enable DMZ host

[DMZ技术](https://zh.wikipedia.org/zh-cn/DMZ)，Demilitarized Zone的缩写，是一种网络安全技术，用于将内部网络与外部网络隔离开来。而对于家庭网络而言，DMZ主机的则是路由器将所有端口的流量都转发到这台主机上。

> 在严格意义上，DMZ与内部网络是隔离的，但是在家庭网络中，DMZ主机仍然可以访问内网，而内网用户也可以访问DMZ主机。

在路由器设置中，找到DMZ主机设置，将你的电脑ip设置为DMZ主机。

首先查询自己电脑的内网ip地址：

```shell
ipconfig /all
```

![]()

记下地址为`192.168.31.215`

以我的小米路由器为例，登录路由器后台，找到`高级设置`-`端口转发`-`DMZ主机`，将地址填入：

![]()

保存即可。

> 如果你的路由器不支持DMZ主机设置，可以尝试将你的电脑设置为静态ip，并将所有的UDP端口转发到你的电脑上。


### Change to Bridge

目前的家庭网络通常是 光纤入户 -> 运营商提供的智能网关 -> 用户路由器 -> 用户电脑的结构。其中智能网关通常是光猫+路由器+AP的缝合怪。按照大部分地区的安装指导，光猫默认会工作在NAT模式下，以便于用户能够直接使用，而无需拨号。

然而，大部分光猫NAT的策略都默认设置为对称性NAT，即使光猫拥有DMZ主机设置，最终NAT类型也是对称性NAT。

因此，我们需要将智慧网关设置为桥接模式（工作在仅光猫状态），将路由器设置为拨号上网，再在路由器上设置DMZ主机。

> 是不是看起来很怪？事实上大部分家庭网络都是FullCone NAT，但是由于智慧网关的NAT策略，使得家庭网络的NAT类型变为了对称性NAT。

将智慧网关设置为桥接状态，通常需要获取光猫的超级管理员密码，然后删除原有的配置，新建新的桥接配置，并在下一级的路由器上设置拨号上网。

由于篇幅所限，这里不再赘述具体的操作步骤。光猫的具体破解方式各异，可以尝试自行搜索`XXX-XX型号光猫改桥接`。

---

通常来讲，设置好桥接 - 设置DMZ主机 - 关闭防火墙后，你的家庭网络应该已经变为了FullCone NAT。此时不妨利用pystun3测试一下你的NAT类型。如果已经为FullCone，那么恭喜你。如果没有，那么你当地的运营商很可能对网络进行了限制。

## So, why I prefer FullCone NAT

第一个原因是，相对于公网IPV4，FullCone的改造更为廉价和安全。在大多数地区，公网IPV4的价格昂贵，而且公网IPV4的暴露会使得内网用户的安全性大大降低。~~此外，移动运营商由于本身v4资源匮乏，绝大多数地区已经不再提供公网IPV4~~

此外，相较于IPV6，传统的IPV4的网络设备更为成熟，出门在外想要连回家里的网络，如果没有IPV6，那么还得要绕道服务器转发。

相对于传统服务器内网穿透，直接点对点链接的优势无疑是巨大的，最终双方的访问质量仅取决于双方的网络质量，而不再受到服务器的限制。（比如我在外就可以直接跑满家庭上行100M，而不是服务器龟速5M上行，这使得远程串流游戏成为了可能）

回到文章的刚开始，由于我拥有了FullCone NAT，当MC服务器启动在我电脑后，通过N2N软件，朋友的客户端能够直接链接到我的电脑上。由于我们过年回家都在台州，相互之间直接连接的质量也相较于内网穿透的质量高上不少。

> 尽管N2N不需要FullCone也有一定概率能够打洞，但是FullCone就是爽

然而除此之外，如果对FullCone网络进行恰当的改造，那么我就能在无法拥有公网ip（毕竟是移动）的情况下，享受公网ip的待遇。访问效果上等同于拥有了一组公网IP:端口。

### Export My Server to Public Internet

先前我的脚本已经证明，FullCone网络在通过恰当的方式打洞后，能够直接将内网ip暴露在公网上。事实上，Github已经有类似的项目能够探测FullCone NAT的映射对的程序，例如[NATMAP](https://github.com/heiher/natmap) 和 [Natter](https://github.com/MikeWang000000/Natter)。

其中，NATMAP基于C++，暂时还不支持Windows。而Natter则是基于Python的，支持Windows（但截至本文发稿时Windows上UDP穿透仍存在严重的问题），也支持流量转发（由于探测需要临时占用端口，而部分程序无法解除端口占用，故可以新开一个随机端口用于探测，然后将探测端口流量转发到目标端口即可）。

事实上，你可以利用NATMAP或Natter探测到的映射对记录映射对，并通过其他简易的内网穿透或者定时上传到公开网站的方式，实现一个简单的DDNS。

> 另一方面，DNS记录中存在名为SRV的记录类型，可以指定端口。如果你拥有一个域名，那么你可以通过SRV记录将你的映射对共享出去。
>
> 与DDNS技术相比，通过FullCone打洞仅仅多了一个端口的记录。

> 此外，截至本文发稿时，Natter“固定”映射对的效果尚不如NATMAP，在关闭程序后映射对可能会发生改变，但是Natter的配置更加方便，也支持流量转发。

通过这种方式，我已经成功将我的服务器Wireguard入口暴露到了公网上，至此，我可以在不购买公网IPV4、无IPV6的情况下，在任何地方通过我的服务器访问到我的家庭网络。

至于其他的RDP、SSH等服务，也可以通过类似的方式实现。不过建议还是只暴露Wireguard入口，然后通过Wireguard内网穿透到其他服务。~~毕竟安全第一~~

### Get A HighID in P2P download

在电驴下载中，存在这`LowID`和`HighID`的概念。`LowID`是指没有公网IPV4的用户，而`HighID`则是指拥有公网的用户。两个`LowID`之间无法直接链接，但是`HighID`可以直接链接到`LowID`和`HighID`。

在其他P2P下载中，也存在类似的概念。放到PT下载中，拥有一个`LowID`的用户，相对于`HighID`用户而言，下载速度会大大降低。同时，`LowID`用户在做种时也无法主动链接到其他`LowID`用户，从而影响了共享效果，在PT上传中很难抢到上传流量。

然而，通过FullCone NAT，我可以将我的PT客户端的端口暴露在公网上，从而获得了`HighID`。但是在这其中存在一个问题，映射对中内网端口和外网端口通常是不一致的，而PT客户端向Tracker服务器报告的端口是内网端口，外网用户无法用（公网ip:内网端口）访问到我的PT客户端。

因此，需要先随机探测一个映射对，记录（内网ip:内网随机端口）和（公网ip:外网端口）的对应关系，并新建一个转发，将（内网ip:内网随机端口）的流量转发到（内网ip:外网端口），并通过BT客户端的API修改BT程序监听端口为外网端口。通过这种方式，使BT客户端向Tracker服务器报告的端口为外网端口，从而获得了`HighID`。

[这是我之前不知道在那个论坛抄下来的脚本](https://gist.github.com/ChenYFan/8b5ba92875a195a992c7d451490971e4)，可利用natmap或natter的script功能自动修改BT客户端的监听端口并转发流量，出处已不可考。

---

到这里为止，FullCone NAT好像已经变得完美无瑕，它拥有者极高的性价比，并且有着丰富的DIY内容。这篇文章在这里应该已经结束了

...吗？

## It's Hard to Get a FullCone NAT

你并没有那么容易获得全锥网络。由于大部分运营商的光猫已经被逐步替换为了智能网关，破解智能网关本身就具有这相当高的难度。

> 我知道你想说什么，花了150的租金，拿了个什么都缝合了、什么都没缝合好的电子垃圾。wifi只有2.4G不支持5G，不支持在NAT中下发公网IPV6，大部分功能被运营商锁定不让你用，甚至还有[远控后门](https://v2ex.com/t/952671)。

此外，不像我手上的移动H3-2se智能网关有着开启telenet的漏洞，大部分智能网关想要获取超管密码都极为困难，想要破解获得密码还得根据型号来选择方式。部分机型还需要替换备份包的方式刷机，稍有不慎就会出现意外，破解的难度极高。

另一方面，运营商显然是不希望改为桥接模式的。

