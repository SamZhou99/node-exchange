const utils99 = require('node-utils99')
const path = require('path')
const db_config = require('../../config/db.js')

const csvFileArr = ['./Bitpie.csv']

const server = require('../../app/service/index.js')

const db = new utils99.mysqlSync(db_config.mysql)

async function truncateTable() {
    await db.Query('TRUNCATE `user`')
    await db.Query('TRUNCATE `user_category`')
    await db.Query('TRUNCATE `login_log`')
    await db.Query('TRUNCATE `recharge_log`')
    await db.Query('TRUNCATE `invite_code`')
    await db.Query('TRUNCATE `system_wallet`')
    await db.Query('TRUNCATE `page_view_log`')
    await db.Query('TRUNCATE `platform_currency`')
    // 删减后没有初始化
    await db.Query('TRUNCATE `platform_currency_buy_log`')
    await db.Query('TRUNCATE `user_authentication`')
    await db.Query('TRUNCATE `user_authentication_photo`')
}

async function initUserCategory() {
    let data = [
        ['super', '超级管理'],
        ['cfo', '财务'],
        ['marketing', '营销'],
        ['agent', '代理'],
        ['vip', 'VIP用户'],
        ['member', '普通会员'],
    ]
    for (let i = 0; i < data.length; i++) {
        await db.Query('INSERT INTO user_category (label,value) VALUES (?,?)', [data[i][0], data[i][1]])
    }
}

async function initUser() {
    await testUser()
}

async function testUser() {
    let code = await server.inviteCode.getOnlyInviteCode()
    await server.inviteCode.bindInviteCode(1, code)

    // let adminPassword = server.inviteCode.createRandomCode(12)
    // console.log('管理密码', adminPassword)

    let adminPassword = 'admin'

    // 测试数据，真实环境，需要注销掉，不要执行。
    // 注册三个测试用户
    let data = [
        { inviteCode: '!@#$', account: 'admin', password: utils99.MD5(utils99.MD5(adminPassword)), mail: 'admin@qq.com', mobile: '13600000000' },
        // { inviteCode: code, account: 'user1', password: utils99.MD5(utils99.MD5('user1')), mail: 'user1@qq.com', mobile: '13600001111' },
        // { inviteCode: code, account: 'user2', password: utils99.MD5(utils99.MD5('user2')), mail: 'user2@qq.com', mobile: '13600002222' },
        // { inviteCode: code, account: 'user3', password: utils99.MD5(utils99.MD5('user3')), mail: 'user3@qq.com', mobile: '13600003333' }
    ]
    for (let i = 0; i < data.length; i++) {
        let item = data[i]
        await server.user.createNewUser(item.inviteCode, item.account, item.password, 6, item.mail, item.mobile, 1, utils99.Time(), utils99.Time())
    }

    // 清空绑定的usdt钱包，重新绑定已用过的。
    let usdtClear = await db.Query('UPDATE system_wallet SET bind_user_id=0 WHERE wallet_type="usdt-trc20"')
    let userType = await db.Query('UPDATE user SET type=1 WHERE id=1')
    // 关联四个钱包，包括管理员
    let testData = [
        { id: 1, wallet_address: 'TAg8tdcJttbD9AXAEzcQjdHM99s1SAKJuN' },
        { id: 2, wallet_address: 'TUbWM1G6QnjCBfif6hVmJJvKSooBKph5Dn' },
        { id: 3, wallet_address: 'TWaTBz3rScoR1GWxC631XMzmPzc5zrzGUh' },
        { id: 4, wallet_address: 'TNgDLrLQodteGyJiHfnTdDZfFv5f386yTU' },
    ]
    for (let i = 0; i < testData.length; i++) {
        let item = testData[i]
        let res = await db.Query('SELECT * FROM system_wallet WHERE wallet_address=? AND wallet_type=? LIMIT 1', [item.wallet_address, 'usdt-trc20'])
        if (res.length > 0) {
            await db.Query('UPDATE system_wallet SET bind_user_id=? WHERE id=?', [item.id, res[0].id])
        }
    }
}

async function importCSV() {
    let results = []
    for (let i = 0; i < csvFileArr.length; i++) {
        let itemFilePath = csvFileArr[i]
        let csvFile = path.resolve(__dirname, itemFilePath)
        let res = await server.wallet.importCSV(csvFile)
        results.push(res)
    }
    return results
}

async function initPlatformCurrency() {
    await db.Query("INSERT INTO `platform_currency` VALUES ('1', '/images/symbol.png', 'LETH', 'Leth', '100000000', '0', '4', '0.03400000', '20.00000000', '0.00000000', '0.00000000', '2021-12-01 00:00:00', '2022-12-01 00:00:00', '2021-12-19 18:43:25', '2021-12-19 18:43:28');")
}

async function init() {
    await truncateTable()
    await initUserCategory()
    let res = await importCSV()
    await initUser()
    await initPlatformCurrency()
    console.log('over', res)
}


if (require.main === module) {
    init()
}

module.exports = { init }