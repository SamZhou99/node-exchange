const utils99 = require('node-utils99')
const path = require('path')
const db_config = require('../../config/db.js')

const csvFileArr = ['./Bitpie.csv']

const server = require('../../app/service/index.js')

const db = new utils99.mysqlSync(db_config.mysql)





async function deleteUser(userIdArr) {
    for (let i = 0; i < userIdArr.length; i++) {
        const userId = userIdArr[i]
        await db.Query("DELETE FROM `user` WHERE id=?", [userId])
        await db.Query("DELETE FROM `invite_code` WHERE user_id=?", [userId])
        await db.Query("DELETE FROM `login_log` WHERE user_id=?", [userId])
        await db.Query("DELETE FROM `page_view_log` WHERE user_id=?", [userId])
        await db.Query("DELETE FROM `platform_currency_buy_log` WHERE user_id=?", [userId])
        await db.Query("DELETE FROM `recharge_log` WHERE user_id=?", [userId])
        await db.Query("UPDATE `system_wallet` SET bind_user_id=0 WHERE bind_user_id=?", [userId])
        await db.Query("DELETE FROM `user_authentication` WHERE user_id=?", [userId])
        await db.Query("DELETE FROM `user_authentication_photo` WHERE user_id=?", [userId])
        await db.Query("DELETE FROM `withdraw_log` WHERE user_id=?", [userId])
    }
}

async function init() {
    const userIdArr = [21, 22, 23, 24, 25]
    await deleteUser(userIdArr)
    console.log('删除完成')
}





if (require.main === module) {
    init()
}

module.exports = { init }