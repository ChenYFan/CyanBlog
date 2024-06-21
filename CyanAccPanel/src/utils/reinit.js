import CacheDB from '@chenyfan/cache-db'
const reinit = async () => {
    const db = new CacheDB('CyanAcc', "CyanAccDB")
    const ReInit = (JSON.parse((await db.read('CyanAcc_Config')) || JSON.stringify({ reinit: true }))).reinit
    if (ReInit) {
        return await fetch('/CyanAcc/api', {
            method: 'POST',
            body: JSON.stringify({ action: 'REINIT' })
        })
            .then(res => res.json())
            .then(data => {
                return data.status === "OK"
            })
    }else{
        return false
    }
}
export default reinit