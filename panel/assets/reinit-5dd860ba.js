import"./notyf-6eadf77a.js";const a=async()=>{const n=new CacheDB("CyanAcc","CyanAccDB");return JSON.parse(await n.read("CyanAcc_Config")||JSON.stringify({reinit:!0})).reinit?await fetch("/CyanAcc/api",{method:"POST",body:JSON.stringify({action:"REINIT"})}).then(t=>t.json()).then(t=>t.status==="OK"):!1};export{a as r};