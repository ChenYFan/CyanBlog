const CyanAccAPI = async (action, data) => {
    if (typeof data === 'undefined') {
        data = {}
    }
    return await fetch('/CyanAcc/api', {
        method: 'POST',
        body: JSON.stringify({
            action: action,
            ...data
        })
    })
        .then(res => res.json())
        .then(Resdata => {
            if (Resdata.status === "OK") {
                return Resdata.data
            } else {
                throw new Error(`Get Error: ${Resdata.message}`)
            }
        })
}
export default CyanAccAPI