const fs = require('fs')
const utils99 = require('node-utils99')
const { update } = require('node-utils99/mysql-sync-cache')
const dbConfig = require('../../config/db.js')
const webConfig = require('../../config/web.js')
const db = new utils99.mysqlSync(dbConfig.mysql)

function isNumber(anything) {
    let n = parseInt(anything)
    return !isNaN(n)
}

let service = {
    // 邀请码功能
    inviteCode: {
        createRandomCode(len = 4) {
            const s = '1234567890abcdefghijklmnopqrstuvwxyz'
            let temp = ''
            for (let i = 0; i < len; i++) {
                temp += s.substr(Math.floor(s.length * Math.random()), 1)
            }
            return temp
        },
        async findByCode(code) {
            let res = await db.Query('SELECT * FROM invite_code WHERE code=? LIMIT 1', [code])
            return (res.length > 0) ? res[0] : null
        },
        async getOnlyInviteCode() {
            for (let i = 0; i < 1000; i++) {
                let code = service.inviteCode.createRandomCode(webConfig.invite_code_length)
                let res = await service.inviteCode.findByCode(code)
                if (res) {
                    continue
                }
                return code
            }
        },
        async bindInviteCode(userId, code) {
            await db.Query('INSERT INTO `invite_code` (user_id, code) VALUES(?,?)', [userId, code])
            return true
        },
        // 测试，产生1000个邀请码
        async test() {
            for (let i = 0; i < 1000; i++) {
                let code = await service.inviteCode.getOnlyInviteCode()
                let res = await service.inviteCode.bindInviteCode(0, code)
                console.log(res)
            }
        }
    },
    // 用户操作
    user: {
        /**
         * 用户数
         * @returns 
         */
        async count() {
            let res = await db.Query('SELECT COUNT(*) AS count FROM user')
            return res[0].count
        },
        /**
         * 更新 一个字段的值
         * @param {*} id 
         * @param {*} field 
         * @param {*} value 
         */
        async updateOneField(id, field, value) {
            let res = await db.Query(`UPDATE user SET ${field}=? WHERE id=?`, [value, parseInt(id)])
        },
        /**
         * 检查 帐号，邮箱，电话 是否存在
         * @param {*} account 
         * @param {*} mail 
         * @param {*} mobile 
         * @returns 
         */
        async checkAccountExist(account, mail, mobile) {
            let res = await db.Query('SELECT id,account,email,mobile FROM `user` WHERE account=? OR email=? OR mobile=? LIMIT 1', [account, mail, mobile])
            return res.length > 0 ? res[0] : null
        },
        /**
         * 登录
         * @param {*} account 帐号，邮箱，手机
         * @param {*} password 原始密码未md5过的
         * @returns 一个用户信息/null
         */
        async login(account, password) {
            let res = await db.Query("SELECT id,parent_id,account,type,email,mobile,status,create_datetime,update_datetime FROM `user` WHERE (account=? OR email=? OR mobile=?) AND `password`=MD5(?) LIMIT 1", [account, account, account, password])
            return res.length > 0 ? res[0] : null
        },
        /**
         * 登录日志
         * @param {*} user_id 
         * @param {*} user_agent 
         * @param {*} ip 
         * @returns 一个用户信息/null
         */
        async loginLog(user_id, user_agent, ip) {
            let time = utils99.Time()
            let res = await db.Query('INSERT INTO login_log (user_id,user_agent,ip,time) VALUES(?,?,?,?)', [user_id, user_agent, ip, time])
            return res
        },
        /**
         * 创建一个新用户
         * @param {*} data 
         * @returns 
         */
        async createNewUser(inviteCode, account, password, type, mail, mobile, status, create_datetime, update_datetime) {
            let res = await service.inviteCode.findByCode(inviteCode)
            let parent_id = res.user_id
            res = await db.Query(`INSERT INTO user(parent_id,account,password,type,email,mobile,status,create_datetime,update_datetime) VALUES(?,?,?,?,?,?,?,?,?)`,
                [parent_id, account, password, type, mail, mobile, status, create_datetime, update_datetime])
            // 新用户绑定 邀请码
            let user_id = res.insertId
            let code = await service.inviteCode.getOnlyInviteCode()
            await service.inviteCode.bindInviteCode(user_id, code)
            // 用户绑定 转入钱包地址
            await service.wallet.bindWalletAddressToUserId(user_id)
            return res
        },
        /**
         * 查询一个用户的 系统充值 钱包地址
         * @param {*} user_id 
         * @returns 
         */
        async walletAddress(user_id) {
            let res = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=? LIMIT 1', [user_id])
            return res.length > 0 ? res[0] : null
        },
        /**
         * 查询一个用户的 邀请码
         * @param {*} user_id 
         * @returns 
         */
        async inviteCode(user_id) {
            let res = await db.Query('SELECT * FROM invite_code WHERE user_id=? LIMIT 1', [user_id])
            return res.length > 0 ? res[0] : null
        },
        /**
         * 查询登录日志
         * @param {*} user_id 
         * @returns 
         */
        async loginLog(user_id) {
            let res = await db.Query('SELECT * FROM login_log WHERE user_id=? ORDER BY id DESC LIMIT 10', [user_id])
            return res
        },
        /**
         * 用户组分类
         * @returns 
         */
        async groupCategory() {
            let res = await db.Query('SELECT * FROM group_category ORDER BY id LIMIT 100')
            return res
        },
        /**
         * 用户列表
         * @returns 
         */
        async list() {
            let res = await db.Query('SELECT u.id,u.parent_id,u.account,u.type,gc.label,gc.value,u.email,u.mobile,u.status,u.create_datetime,u.update_datetime FROM user AS u LEFT JOIN group_category AS gc ON gc.id=u.type ORDER BY id DESC LIMIT 1000')
            for (let i = 0; i < res.length; i++) {
                let item = res[i]
                let id = item.id
                let parent_id = item.parent_id
                // 钱包地址
                let r = await db.Query('SELECT id,wallet_address FROM system_wallet WHERE bind_user_id=? LIMIT 1', [id])
                item.wallet = r.length > 0 ? r[0] : null
                // 邀请码
                r = await db.Query('SELECT id,code FROM invite_code WHERE user_id=? LIMIT 1', [id])
                item.invite = r.length > 0 ? r[0] : null
                // 我的上级
                r = await db.Query('SELECT u.id,u.email,u.mobile,u.account,u.status,u.type,gc.label,gc.value FROM user AS u LEFT JOIN group_category AS gc ON gc.id=u.type WHERE u.id=? LIMIT 1', [parent_id])
                item.parent = r.length > 0 ? r[0] : null
                // 充值记录
                r = await db.Query('SELECT * FROM trade_log WHERE to_address=? LIMIT 100', [item.wallet.wallet_address])
                item.trade = r
                item.tradeTotal = 0
                for (let j = 0; j < item.trade.length; j++) {
                    item.tradeTotal += item.trade[0].amount
                }
            }
            return res
        },
        /**
         * 某用户，邀请多少人
         * @param {*} user_id 
         */
        async inviteList(user_id) {
            let res = await db.Query('SELECT id,parent_id,account,type,email,mobile,status,create_datetime,update_datetime FROM user WHERE parent_id=? ORDER BY id DESC LIMIT 500', [user_id])
            return res
        },

    },
    wallet: {
        async list(start = 0, limit = 10) {
            let res = await db.Query('SELECT COUNT(0) AS total FROM system_wallet')
            let list = await db.Query('SELECT * FROM system_wallet ORDER BY id DESC LIMIT ?,?', [start, limit])
            for (let i = 0; i < list.length; i++) {
                let item = list[i]
                let res = await db.Query('SELECT id,account,email,mobile FROM user WHERE id=?', [item.upload_user_id])
                item.uploader = res[0]
                if (item.bind_user_id > 0) {
                    res = await db.Query('SELECT id,account,email,mobile FROM user WHERE id=?', [item.bind_user_id])
                    item.binder = res[0]
                }
            }
            return { list, total: res[0].total }
        },
        /**
         * 绑定系统钱包地址 到 用户
         * @param {*} user_id 
         */
        async bindWalletAddressToUserId(user_id) {
            let list1 = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=0 ORDER BY id LIMIT 1')
            let list2 = await db.Query('UPDATE system_wallet SET bind_user_id=? WHERE id=?', [user_id, list1[0].id])
            return [list1, list2]
        },
        /**
         * 通过钱包地址 查询系统钱包相关数据
         * @param {*} wallet_address 
         * @returns 
         */
        async walletAddress(wallet_address) {
            let res = await db.Query('SELECT * FROM system_wallet WHERE wallet_address=?', [wallet_address])
            return res.length > 0 ? res[0] : null
        },
        /**
         * 通过钱包地址 更新时间
         * @param {*} wallet_address 
         */
        async updateTimeWalletAddress(wallet_address) {
            let updateTime = utils99.Time()
            let res = await db.Query('UPDATE system_wallet SET update_datetime=? WHERE wallet_address=?', [updateTime, wallet_address])
        },
        /**
         * 插入交易记录
         * @param {*} hash 
         * @param {*} block 
         * @param {*} timestamp 
         * @param {*} amount 
         * @param {*} ownerAddress 
         * @param {*} toAddress 
         * @returns 
         */
        async tradeAddLog(hash, block, timestamp, amount, ownerAddress, toAddress) {
            let res = await db.Query('SELECT * FROM trade_log WHERE hash=? LIMIT 1', [hash])
            if (res.length > 0) {
                return null
            }
            let create_time = utils99.Time()
            res = await db.Query('INSERT INTO trade_log (hash,block,owner_address,to_address,amount,time,create_time) VALUES (?,?,?,?,?,?,?)', [hash, block, ownerAddress, toAddress, amount, timestamp, create_time])
            return res
        },
        /**
         * 查询 某用户的交易记录列表
         * @param {*} user_id 
         * @returns 
         */
        async tradeList(user_id) {
            let res = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=? LIMIT 1', [user_id])
            if (res.length <= 0) {
                return null
            }
            let wallet_address = res[0].wallet_address
            res = await db.Query('SELECT * FROM trade_log WHERE to_address=? ORDER BY id DESC LIMIT 500', [wallet_address])
            return res
        },
        /**
         * 查询 某用户的交易记录列表 通过 钱包地址
         * @param {*} wallet_address 
         * @returns 
         */
        async tradeListByWalletAddress(wallet_address) {
            let res = await db.Query('SELECT * FROM trade_log WHERE to_address=? ORDER BY time DESC LIMIT 500', [wallet_address])
            return res
        },
        /**
         * usdt金额总和
         * @returns 
         */
        async usdtAmount() {
            let res = await db.Query('SELECT SUM(trade_log.amount) AS amount FROM trade_log')
            return res[0].amount
        },
        /**
         * 钱包总数和已使用数
         * @returns 
         */
        async walletAddressCount() {
            let res = await db.Query('SELECT COUNT(*) AS count FROM system_wallet')
            let total = res[0].count
            res = await db.Query('SELECT COUNT(0) AS count FROM system_wallet WHERE bind_user_id<>0')
            let used = res[0].count
            return { total, used }
        },
        /**
         * 导入csv数据
         * @param {*} csv 
         * @returns 
         */
        async importCSV(csv) {
            let res = fs.readFileSync(csv)
            let csv_str = res.toString()
            let a = csv_str.split('\n')
            let results = {
                // 总数
                total: a.length,
                // 不合格的数据
                unqualified: 0,
                unqualifiedArr: [],
                // 已存在的数据
                exist: 0,
                // 导入成功的数据
                success: 0,
            }
            for (let i = 0; i < a.length; i++) {
                let item = a[i].split(',')
                if (!isNumber(item[0])) {
                    results.unqualified++
                    results.unqualifiedArr.push(item[0])
                    continue
                }
                let res = await db.Query('SELECT * FROM system_wallet WHERE wallet_address=? LIMIT 1', [item[1]])
                if (res.length > 0) {
                    results.exist++
                    continue
                }
                let upload_user_id = 1
                let wallet_address = item[1]
                let create_datetime = utils99.Time()
                let update_datetime = utils99.Time()
                await db.Query(`INSERT INTO system_wallet (upload_user_id,wallet_address,create_datetime,update_datetime) VALUES (?,?,?,?)`, [
                    upload_user_id,
                    wallet_address,
                    create_datetime,
                    update_datetime
                ])
                results.success++
            }
            return results
        },
        async tradeLog(start,limit){
            let res = await db.Query('SELECT COUNT(0) AS total FROM trade_log')
            let list = await db.Query('SELECT * FROM trade_log ORDER BY id DESC LIMIT ?,?', [start, limit])
            for (let i = 0; i < list.length; i++) {
                let item = list[i]
                let res = await db.Query('SELECT bind_user_id FROM system_wallet WHERE wallet_address=?', [item.to_address])
                let bind_user_id = res[0].bind_user_id
                if (bind_user_id > 0) {
                    res = await db.Query('SELECT id,account,email,mobile FROM user WHERE id=?', [bind_user_id])
                    item.user = res[0]
                }
            }
            return { list, total: res[0].total }
        },
    },
    page: {
        /**
         * 浏览量日志
         * @param {*} user_id 
         * @param {*} ip 
         * @param {*} url 
         * @param {*} user_agent 
         */
        async pageviewLog(user_id, ip, referer, url, user_agent) {
            let create_datetime = utils99.Time()
            let res = await db.Query('INSERT INTO page_view_log(user_id,ip,referer,url,user_agent,create_datetime) VALUES(?,?,?,?,?,?)', [user_id, ip, referer, url, user_agent, create_datetime])
            return res
        },
        /**
         * 浏览数
         * @returns 
         */
        async count() {
            let res = await db.Query('SELECT COUNT(*) AS count FROM page_view_log')
            return res[0].count
        },
        /**
         * 浏览记录列表
         * @param {*} start 
         * @param {*} limit 
         * @returns 
         */
        async list(start, limit) {
            let res = await db.Query('SELECT COUNT(0) AS total FROM page_view_log')
            let list = await db.Query('SELECT * FROM page_view_log ORDER BY id DESC LIMIT ?,?', [start, limit])
            for (let i = 0; i < list.length; i++) {
                let item = list[i]
                if (item.user_id > 0) {
                    let res = await db.Query('SELECT id,account,email,mobile FROM user WHERE id=?', [item.user_id])
                    item.user = res[0]
                }
            }
            return { list, total: res[0].total }
        }
    },




}


module.exports = service;