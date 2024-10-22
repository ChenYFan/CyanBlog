---
title: Friends
no_date: true
no_comments: true
---

## Me

<div class="container">
    <div class="card" style="padding: 8px 16px;">
        <div>
            <h1>I'm CyanFalse</h1>
            这是我的友链信息，你可以先添加以下信息到自己的博客，然后点击提交友链申请按钮自行添加友链信息并发起PullRequest，待审核通过后友链会出现在此处。
            ```json
            {
                "title":"CyanFalse's Weblog",
                "link":"https://blog.eurekac.cn",
                "avatar":"https://registry.npmmirror.com/@chenyfan/auto-img-filter/0.0.0-202410180052/files/demo/logo/512.png",
                "intro":"I'm CyanFalse,New to Here.",
                "color":"#ffc107"
            }
            ```
            <div class="actions">
                <div class="right">
                    <a class="action-button-primary" href="https://github.com/ChenYFan/CyanBlog/blob/main/themes/cyanset/source/links.json">Create A Pull Request</a>
                </div>
            </div>
        </div>
    </div>
</div>

## Friends
<div class="container">
    <div class="card-grid" id="normal-friends"></div>
    <details>
        <summary>无对应友链但可以访问的伙伴</summary>
        <div class="card-grid" id="unrelink-friends"></div>
    </details>
    <details>
        <summary>无法访问的伙伴</summary>
        <div class="card-grid" id="unaccessible-friends"></div>
    </details>
</div>

<script>
    setTimeout(async () => {
        const FriendsData = await fetch("/links.json").then(res => res.json());
        const $1 = document.getElementById("normal-friends");
        const $2 = document.getElementById("unrelink-friends");
        const $3 = document.getElementById("unaccessible-friends");

        FriendsData.forEach(friend => {
            const childHtml = ` <div class="card">
        <div class="cover-img">
            <img class="lazy" src="${friend.image}" alt="${friend.title}" no-fancybox>
        </div>
        <div class="content">
            <p class="title">${friend.title}</p>
            <p class="description">${friend.intro}</p>
        </div>
        <div class="actions">
            <div class="right">
                <a class="action-button-primary" href="${friend.link}">Visit</a>
            </div>
        </div>
    </div> `
            const child = document.createElement("div");
            child.innerHTML = childHtml;
            if (friend.relink) {
                $1.appendChild(child);
            } else if (friend.unaccessible) {
                $3.appendChild(child);
            } else {
                $2.appendChild(child);
            }
        });
    }, 200);
</script>
