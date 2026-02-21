---
title: CyanAcc FallBack Page
no_comments: true
---

CyanAcc目前处于非活动状态，这是由CyanAcc FallBack的一个错误界面。

点击以下按钮清空CacheStorage并尝试重装CyanAcc。此按钮会输出错误日志。

如果你是错误地禁用了CyanAcc，请点击重新启用按钮以重新激活CyanAcc

<button class="btn btn-primary" onclick="reinstall_CyanAcc()">重装CyanAcc</button>
<button class="btn btn-primary" onclick="reactive_CyanAcc()">重新启用并重装CyanAcc</button>
<button class="btn btn-primary" onclick="clean_CyanAcc()">清除所有存储的数据并重装CyanAcc</button>
<p id="Acc_Debug_Log"></p>

<script>
const AccLog = document.getElementById('Acc_Debug_Log')
window.reactive_CyanAcc = async () => {
    const db = new CacheDB('CyanAcc', "CyanAccDB")
    const CyanAcc = JSON.parse(await db.read('CyanAcc_Config'))
    CyanAcc.enable = true
    await db.write('CyanAcc_Config', JSON.stringify(CyanAcc))
    AccLog.innerText += "已将CyanAcc设置为启用状态，尝试重新安装CyanAcc...\n"
    await reinstall_CyanAcc()
}
window.clean_CyanAcc = async () => {
    for (CacheStorageKey of (await caches.keys())) {
        await caches.delete(CacheStorageKey)
        AccLog.innerText += `已清除名为${CacheStorageKey}的存储\n`
    }
    AccLog.innerText += "所有缓存已清除，正在尝试重新安装CyanAcc...\n"
    await reinstall_CyanAcc()
}
window.reinstall_CyanAcc = async () => {
    navigator.serviceWorker.register("/CyanAcc.js").then(() => {
        AccLog.innerText += '貌似安装是成功的，3s后此页面将尝试刷新以进入由CyanAcc托管的设置页面...\n'
        setTimeout(() => {
            location.search = '?t=' + new Date().getTime()
        }, 3000)
    }).catch((err) => {
        AccLog.innerText += '貌似安装失败了，错误信息如下：\n' + err
    })
}        
</script>