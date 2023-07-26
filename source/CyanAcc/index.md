---
title: CyanAcc FallBack Page
no_comments: true
---

CyanAcc貌似并没有安装成功，这是由CyanAcc FallBack的一个错误界面。

点击以下按钮尝试重新安装CyanAcc。此按钮会输出错误日志。

<button class="btn btn-primary" onclick="reinstall_CyanAcc()">重新安装!</button>

<p id="Acc_Debug_Log"></p>

<script>
    const AccLog = document.getElementById('Acc_Debug_Log')
    function reinstall_CyanAcc() {
         navigator.serviceWorker.register(`/CyanAcc.js?time=${new Date().getTime()}`).then(()=>{
            AccLog.innerText = '貌似安装是成功的，3s后此页面将尝试刷新以进入由CyanAcc托管的设置页面...'
            setTimeout(()=>{
                location.search = '?t=' + new Date().getTime()
            }, 3000)
         }).catch((err)=>{
            AccLog.innerText = '貌似安装失败了，错误信息如下：\n' + err
         })
    }
</script>