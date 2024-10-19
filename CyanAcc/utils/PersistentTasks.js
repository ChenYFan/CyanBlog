export default {
    pool: [],
    add: function (task, run = true, interval = 1000 * 60, description = "这个任务没有描述") {
        this.pool.push({
            enable: true,
            function: task,
            interval: interval,
            description: description,
            lastrun: {
                time: 0
            }
        })
        if (run) {
            try { task().then(() => { }) } catch (e) { }
        }
    },
    run: async function (id) {
        if (!this.pool[id].enable) return false;
        if (this.pool[id].lastrun.time + this.pool[id].interval > new Date().getTime()) return false;
        await this.pool[id].function()
        cons.i(`Persistent Task <${this.pool[id].description}> Runned Just Now`)
        this.pool[id].lastrun.time = new Date().getTime()
    },
    runAll: async function () {
        return Promise.all(this.pool.map(async (item, index) => {
            return await this.run(index)
        }))
    },
    stop: function (id) {
        this.pool[id].enable = false
    },
    start: function (id) {
        this.pool[id].enable = true
    },
    clear: function () {
        this.pool = []
    }
}