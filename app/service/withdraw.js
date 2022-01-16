const utils99 = require('node-utils99')
const dbConfig = require('../../config/db.js')
const db = new utils99.mysqlSync(dbConfig.mysql)



let _t = {

    /**
     * 某一条记录
     * @param {*} id 
     * @returns 
     */
    async oneById(id) {
        const res = await db.Query("SELECT * FROM withdraw_log WHERE id=? LIMIT 1", [id])
        return res.length > 0 ? res[0] : null
    },

    /**
     * 提币记录
     * @param {*} user_id 
     * @returns 
     */
    async list(user_id) {
        const res = await db.Query("SELECT * FROM withdraw_log WHERE user_id=? ORDER BY id DESC", [user_id])
        return res
    },

    async allList(start, limit) {
        let res = await db.Query('SELECT COUNT(0) AS total FROM withdraw_log')
        const list = await db.Query("SELECT * FROM withdraw_log ORDER BY id DESC LIMIT ?,?", [start, limit])
        return { list, total: res[0].total }
    },

    /**
     * 提币申请
     * @param {*} user_id 
     * @param {*} status 
     * @param {*} apply_amount 
     * @param {*} real_amount 
     * @param {*} charges 
     * @param {*} type 
     * @param {*} address 
     * @returns 
     */
    async applyFor(user_id, status, apply_amount, real_amount, charges, type, address) {
        let time = utils99.Time()
        const res = await db.Query("INSERT INTO withdraw_log (user_id,status,apply_amount,real_amount,charges,type,address,create_datetime,update_datetime) VALUES(?,?,?,?,?,?,?,?,?)", [user_id, status, apply_amount, real_amount, charges, type, address, time, time])
        return res
    },

    /**
     * 更新提币状态
     * @param {*} id 
     * @param {*} status 
     * @param {*} failed_reason 
     * @returns 
     */
    async updateStatus(id, status, failed_reason) {
        let time = utils99.Time()
        const res = await db.Query("UPDATE withdraw_log SET status=?,failed_reason=?,update_datetime=? WHERE id=?", [status, failed_reason, time, id])
        return res
    }
};



module.exports = _t