const utils99 = require('node-utils99')
const path = require('path')
const db_config = require('../../config/db.js')
const csv = './Bitpie_USDT-TRC20_addresses_202111142214.csv'
const server = require('../../app/service/index.js')

const db = new utils99.mysqlSync(db_config.mysql)

async function truncateTable() {
    await db.Query('TRUNCATE `user`')
    await db.Query('TRUNCATE `user_group`')
    await db.Query('TRUNCATE `user_wallet`')
    await db.Query('TRUNCATE `user_wallet_log`')
    await db.Query('TRUNCATE `login_log`')
    await db.Query('TRUNCATE `trade_log`')
    await db.Query('TRUNCATE `group_category`')
    await db.Query('TRUNCATE `invite_code`')
    await db.Query('TRUNCATE `system_wallet`')
    await db.Query('TRUNCATE `page_view_log`')
}

async function initGroupCategory() {
    let data = [
        ['super', '超级管理'],
        ['cfo', '财务'],
        ['marketing', '营销'],
        ['agent', '代理'],
        ['vip', 'VIP用户'],
        ['member', '普通会员'],
    ]
    for (let i = 0; i < data.length; i++) {
        await db.Query('INSERT INTO group_category (label,value) VALUES (?,?)', [data[i][0], data[i][1]])
    }
}

async function initAdmin() {
    let parent_id = 0,
        account = 'admin',
        password = utils99.MD5(utils99.MD5('admin')),
        type = 1,
        email = 'admin@qq.com',
        mobile = '13600000000',
        status = 1,
        create_datetime = utils99.Time(),
        update_datetime = utils99.Time();
    await db.Query('INSERT INTO user (parent_id,account,password,type,email,mobile,status,create_datetime,update_datetime) VALUES (?,?,?,?,?,?,?,?,?)',
        [parent_id, account, password, type, email, mobile, status, create_datetime, update_datetime])
    let code = await server.inviteCode.getOnlyInviteCode()
    await server.inviteCode.bindInviteCode(1, code)



    //测试数据，真实环境，需要注销掉，不要执行。

    let data = [
        { inviteCode: code, account: 'user1', password: utils99.MD5('user1'), mail: 'user1@qq.com', mobile: '13600001111' },
        { inviteCode: code, account: 'user2', password: utils99.MD5('user2'), mail: 'user2@qq.com', mobile: '13600002222' },
        { inviteCode: code, account: 'user3', password: utils99.MD5('user3'), mail: 'user3@qq.com', mobile: '13600003333' }
    ]
    for (let i = 0; i < data.length; i++) {
        let item = data[i]
        await server.user.createNewUser(item.inviteCode, item.account, item.password, 6, item.mail, item.mobile, 1, utils99.Time(), utils99.Time())
    }

    let testData = [
        { id: 1, wallet_address: 'TAg8tdcJttbD9AXAEzcQjdHM99s1SAKJuN' },
        { id: 2, wallet_address: 'TUbWM1G6QnjCBfif6hVmJJvKSooBKph5Dn' },
        { id: 3, wallet_address: 'TWaTBz3rScoR1GWxC631XMzmPzc5zrzGUh' },
        { id: 4, wallet_address: 'TNgDLrLQodteGyJiHfnTdDZfFv5f386yTU' },
    ]
    await db.Query('UPDATE system_wallet SET bind_user_id=0')
    for (let i = 0; i < testData.length; i++) {
        let item = testData[i]
        let res = await db.Query('SELECT * FROM system_wallet WHERE wallet_address=? LIMIT 1', [item.wallet_address])
        await db.Query('UPDATE system_wallet SET bind_user_id=? WHERE id=?', [item.id, res[0].id])
    }
}

async function importCSV() {
    let csvFile = path.resolve(__dirname, csv)
    let result = await server.wallet.importCSV(csvFile)
    await db.Query('UPDATE system_wallet SET bind_user_id=1 WHERE id=1')
    return result
}

async function init() {
    await truncateTable()
    await initGroupCategory()
    let res = await importCSV()
    await initAdmin()
    console.log('over', res)
}

// init() 


module.exports = { init }