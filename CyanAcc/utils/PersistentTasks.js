
export default function PersistentTasks() {
    this.pool = []
    this.innerInterval = null
    this.add = function (task, run = true, interval = 1000 * 60, description = "这个任务没有描述", enable = true) {
        this.pool.push({
            enable,
            function: task,
            interval,
            description,
            lastrun: {
                time: 0
            }
        })
        if (run) try { task().then(() => { }) } catch (e) { self.cons.e(`执行持久任务<${description}>时发生错误，已自动停止该任务，错误信息：${e}`) };
    }
    this.run = async (id) => {
        if (!this.pool[id].enable) return false;
        if (this.pool[id].lastrun.time + this.pool[id].interval > new Date().getTime()) return false;
        await this.pool[id].function().catch(e => {
            self.cons.e(`执行持久任务<${this.pool[id].description}>时发生错误，已自动停止该任务，错误信息：${e}`)
        })
        cons.i(`Persistent Task <${this.pool[id].description}> Runned Just Now`)
        this.pool[id].lastrun.time = new Date().getTime()
    }
    this.runAll = async () => {
        return Promise.all(this.pool.map(async (item, index) => {
            return await this.run(index)
        }))
    }
    this.stop = (id) => { this.pool[id].enable = false }
    this.start = (id) => { this.pool[id].enable = true }
    this.clear = () => { this.pool = [] }
    this.startInterval = (i) => {
        i = Math.max(i || 5 * 1000, 5 * 1000)
        if (this.innerInterval) {
            cons.w("PersistentTasks的定时器已经启动，无需重复启动")
            return
        }
        this.innerInterval = setInterval(this.runAll, i)
    }
    this.stopInterval = () => {
        if (!this.innerInterval) {
            cons.w("PersistentTasks的定时器未启动，无需停止")
            return
        }
        clearInterval(this.innerInterval)
        this.innerInterval = null
    }
}