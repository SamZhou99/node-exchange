const fs = require('fs')
const path = require('path')
const utils99 = require('node-utils99')
const { update } = require('node-utils99/mysql-sync-cache')
const dbConfig = require('../../config/db.js')
const webConfig = require('../../config/web.js')
const db = new utils99.mysqlSync(dbConfig.mysql)
const common = require('../../config/common.js')
const tools = require('../lib/tools.js')
const kline = require('./kline.js')
const ws = require('./ws.js')
const withdraw = require('./withdraw.js')

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
         * 一个用户信息 通过 ID 查询
         * @param {*} id 
         * @returns 
         */
        async oneById(id) {
            let res = await db.Query('SELECT id,parent_id,account,type,notes,email,mobile,status,usdt_trc20,usdt_erc20,eth,btc,create_datetime,update_datetime FROM `user` WHERE id=? LIMIT 1', [id])
            return res.length > 0 ? res[0] : null
        },
        /**
         * 一个用户信息 通过 钱包地址 查询
         * @param {*} address 
         * @returns 
         */
        async oneByWalletAddress(address) {
            let res = await db.Query('SELECT u.id,u.parent_id,u.account,u.type,u.email,u.mobile,u.status,u.usdt_trc20,u.usdt_erc20,u.eth,u.btc,u.create_datetime,u.update_datetime,sw.upload_user_id,sw.bind_user_id,sw.wallet_address,sw.wallet_type FROM user AS u LEFT JOIN system_wallet AS sw ON sw.bind_user_id = u.id WHERE sw.wallet_address = ? LIMIT 1', [address])
            return res.length > 0 ? res[0] : null
        },
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
            const time = utils99.Time()
            let res = await db.Query(`UPDATE user SET ${field}=?, update_datetime=? WHERE id=?`, [value, time, parseInt(id)])
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
            let res = await db.Query("SELECT id,parent_id,account,type,email,mobile,status,usdt_trc20,usdt_erc20,eth,create_datetime,update_datetime FROM `user` WHERE (account=? OR email=? OR mobile=?) AND `password`=MD5(?) LIMIT 1", [account, account, account, password])
            return res.length > 0 ? res[0] : null
        },
        /**
         * 登录日志
         * @param {*} user_id 
         * @param {*} user_agent 
         * @param {*} ip 
         * @returns 一个用户信息/null
         */
        async addLoginLog(user_id, user_agent, ip) {
            console.log('写入登录日志：user_id, user_agent, ip')
            console.log(user_id, user_agent, ip)
            let time = utils99.Time()
            let res = await db.Query('INSERT INTO login_log (user_id,user_agent,ip,time) VALUES(?,?,?,?)', [user_id, user_agent, ip, time])
            return res
        },
        /**
         * 创建一个新用户
         * @param {*} inviteCode 
         * @param {*} account 
         * @param {*} password 
         * @param {*} type 
         * @param {*} mail 
         * @param {*} mobile 
         * @param {*} status 
         * @param {*} create_datetime 
         * @param {*} update_datetime 
         * @returns 
         */
        async createNewUser(inviteCode, account, password, type, mail, mobile, status, create_datetime, update_datetime) {
            let res = inviteCode == '!@#$' ? { user_id: 0 } : await service.inviteCode.findByCode(inviteCode)
            let parent_id = res.user_id
            // 插入新帐户
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
        async logoLogList(user_id) {
            let res = await db.Query('SELECT * FROM login_log WHERE user_id=? ORDER BY id DESC LIMIT 10', [user_id])
            return res
        },
        /**
         * 用户组分类
         * @returns 
         */
        async groupCategory() {
            let res = await db.Query('SELECT * FROM user_category ORDER BY id LIMIT 100')
            return res
        },
        /**
         * 用户详细列表
         * @returns 
         */
        async list() {
            let res = await db.Query('SELECT u.id,u.parent_id,u.account,u.type,u.notes,u.usdt_trc20,u.usdt_erc20,u.eth,u.btc,ucg.label,ucg.value,u.email,u.mobile,u.status,u.create_datetime,u.update_datetime FROM user AS u LEFT JOIN user_category AS ucg ON ucg.id=u.type ORDER BY id DESC LIMIT 1000')
            for (let i = 0; i < res.length; i++) {
                let item = res[i]
                item = await service.user.userDetailInfo(item)
            }
            return res
        },
        /**
         * 一个用户的详细信息
         * @param {*} id 用户ID
         * @returns 
         */
        async userDetailInfo(user) {
            let r
            // 邀请码
            r = await db.Query('SELECT id,code FROM invite_code WHERE user_id=? LIMIT 1', [user.id])
            user.invite = r.length > 0 ? r[0] : null
            // 我的上级
            r = await db.Query('SELECT u.id,u.email,u.mobile,u.account,u.status,u.type,u.usdt_trc20,u.usdt_erc20,u.eth,u.btc,ucg.label,ucg.value FROM user AS u LEFT JOIN user_category AS ucg ON ucg.id=u.type WHERE u.id=? LIMIT 1', [user.parent_id])
            user.parent = r.length > 0 ? r[0] : null
            // 钱包地址
            r = await db.Query('SELECT id,wallet_address,wallet_type FROM system_wallet WHERE bind_user_id=? ORDER BY wallet_type LIMIT 10', [user.id])
            user.wallet = r
            for (let i = 0; i < r.length; i++) {
                let walletItem = r[i]
                // 充值记录
                let tradeRes = await db.Query('SELECT * FROM recharge_log WHERE to_address=? LIMIT 100', [walletItem.wallet_address])
                walletItem.trade = tradeRes
                walletItem.tradeTotal = 0
                for (let j = 0; j < walletItem.trade.length; j++) {
                    walletItem.tradeTotal += walletItem.trade[j].amount
                }
            }
            // 平台币余额
            r = await db.Query('SELECT * FROM platform_currency_buy_log WHERE user_id=?', [user.id])
            user.platform_currency_buy_log = r
            user.platform_currency_buy_total = 0
            for (let i = 0; i < r.length; i++) {
                let buyItem = r[i]
                user.platform_currency_buy_total += buyItem.target_amount
            }
            r = await service.user.userAuthenticationInfo(user.id)
            user.auth = r.auth
            return r
        },
        /**
         * 简单信息的用户列表
         * @returns 
         */
        async simpleList() {
            let res = await db.Query('SELECT u.id,u.parent_id,u.account,u.type,u.notes,ucg.label,ucg.value,u.email,u.mobile,u.status,u.create_datetime,u.update_datetime FROM user AS u LEFT JOIN user_category AS ucg ON ucg.id=u.type WHERE u.status=1 ORDER BY id DESC LIMIT 1000')
            for (let i = 0; i < res.length; i++) {
                let item = res[i]
                // 钱包地址
                let r = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=?', [item.id])
                item.wallet = r
            }
            return res
        },
        /**
         * 某用户，邀请多少人
         * @param {*} user_id 
         */
        async inviteList(user_id) {
            let res = await db.Query('SELECT id,parent_id,account,type,email,mobile,status,usdt_trc20,usdt_erc20,eth,create_datetime,update_datetime FROM user WHERE parent_id=? ORDER BY id DESC LIMIT 500', [user_id])
            return res
        },

        /**
         * 首发项目参与
         * @param {*} user_id 用户ID
         * @param {*} target_amount 购买数量
         * @param {*} user_balance 余额(若下面数据为空，为人工添加分)
         * @param {*} coin_amount 帐户币数量
         * @param {*} coin_price 帐户币兑换平台币价格
         * @param {*} coin_type 帐户币类型
         * @returns 
         */
        async buyLog(user_id, target_amount, user_balance = 0, coin_amount = 0, coin_price = 0, coin_type = '') {
            // 更新帐户余额
            let updateUserBalance
            if (coin_type != '') {
                updateUserBalance = await service.user.updateOneField(user_id, coin_type, user_balance - coin_amount)
            }

            // 写入购买记录
            let create_datetime = utils99.Time()
            let update_datetime = utils99.Time()
            console.log(user_id, coin_amount, coin_price, coin_type, target_amount, create_datetime, update_datetime)
            let userBuyLogRes = await db.Query('INSERT INTO platform_currency_buy_log(user_id, target_amount, coin_amount, coin_price, coin_type, create_datetime, update_datetime) VALUES (?,?,?,?,?,?,?)', [user_id, target_amount, coin_amount, coin_price, coin_type, create_datetime, update_datetime])
            return { updateUserBalance, userBuyLogRes }
        },
        /**
         * 上传认证照片
         * @param {*} user_id 
         * @param {*} file 
         * @returns 
         */
        async uploadPhoto(user_id, file) {
            // let res = await service.wallet.importCSV(file.path)
            let b1 = file.path.lastIndexOf('/')
            let b2 = file.path.lastIndexOf('\\')
            let filename
            if (b1 != -1) {
                filename = file.path.substring(b1 + 1, file.path.length)
            }
            if (b2 != -1) {
                filename = file.path.substring(b2 + 1, file.path.length)
            }
            if (!filename) {
                return null
            }
            // 文件移动
            fs.renameSync(file.path, path.join(__dirname, `../../public/Upload/idcard/`, filename))
            await db.Query('INSERT INTO user_authentication_photo(user_id, id_photo, create_datetime, update_datetime) VALUES(?, ?, ?, ?)', [user_id, filename, utils99.Time(), utils99.Time()])
            return filename
        },
        /**
         * 保存或更新 认证信息
         * @param {*} user_id 
         * @param {*} status 
         * @param {*} country 
         * @param {*} full_name 
         * @param {*} id_number 
         * @returns 
         */
        async saveAuthenticationInfo(user_id, status, country, full_name, id_number, failed_reason = "") {
            let res = await service.user.userAuthenticationInfo(user_id)
            let time = utils99.Time()
            if (res.auth) {
                await db.Query('UPDATE user_authentication SET status=?,country=?,full_name=?,id_number=?,failed_reason=?,update_datetime=? WHERE user_id=?', [status, country, full_name, id_number, failed_reason, time, user_id])
            } else {
                await db.Query('INSERT INTO user_authentication(user_id,status,country,full_name,id_number,failed_reason,create_datetime,update_datetime) VALUES(?,?,?,?,?,?,?,?)', [user_id, status, country, full_name, id_number, failed_reason, time, time])
            }
            res = await service.user.userAuthenticationInfo(user_id)
            return res
        },
        /**
         * 用户认证信息
         * @param {*} user_id 
         * @returns { auth, photos }
         */
        async userAuthenticationInfo(user_id) {
            let auth = await db.Query('SELECT * FROM user_authentication WHERE user_id=? LIMIT 1', [user_id])
            auth = auth.length > 0 ? auth[0] : null
            let photos = await db.Query('SELECT id,id_photo FROM user_authentication_photo WHERE user_id=? ORDER BY id DESC', [user_id])
            return { auth, photos }
        }
    },
    wallet: {
        /**
         * 钱包地址列表
         * @param {*} start 
         * @param {*} limit 
         * @returns 
         */
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


            async function bindAddress(res, type, user_id) {
                if (res.length <= 0) {
                    // 如果btc地址没有了，就从库中 【随机】 找一个，插入一条
                    let res = await db.Query('SELECT * FROM system_wallet WHERE wallet_type=? ORDER BY RAND() LIMIT 1', [type])
                    // 复制插入这条数据
                    let item = res[0]
                    let upload_user_id = item.upload_user_id
                    let bind_user_id = user_id
                    let wallet_address = item.wallet_address
                    let wallet_type = item.wallet_type
                    let create_datetime = utils99.Time()
                    let update_datetime = utils99.Time()
                    return await db.Query(`INSERT INTO system_wallet(upload_user_id,bind_user_id,wallet_address,wallet_type,create_datetime,update_datetime) VALUE(?,?,?,?,?,?)`, [upload_user_id, bind_user_id, wallet_address, wallet_type, create_datetime, update_datetime])
                }
                // 库有空的地址，直接绑定
                return await db.Query('UPDATE system_wallet SET bind_user_id=? WHERE id=?', [user_id, res[0].id])
            }

            // 查询库中 没有 空的 钱包地址
            let usdt_trc20_res = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=0 AND wallet_type=? ORDER BY id LIMIT 1', [common.coin.type.USDT_TRC20])
            let usdt_erc20_res = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=0 AND wallet_type=? ORDER BY id LIMIT 1', [common.coin.type.USDT_ERC20])
            let btc_res = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=0 AND wallet_type=? ORDER BY id LIMIT 1', [common.coin.type.BTC])
            let eth_res = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=0 AND wallet_type=? ORDER BY id LIMIT 1', [common.coin.type.ETH])

            // 有空的直接绑定，没有空的，重复利用原有的地址。
            let usdt_trc20 = await bindAddress(usdt_trc20_res, common.coin.type.USDT_TRC20, user_id)
            let usdt_erc20 = await bindAddress(usdt_erc20_res, common.coin.type.USDT_ERC20, user_id)
            let eth = await bindAddress(eth_res, common.coin.type.ETH, user_id)
            let btc = await bindAddress(btc_res, common.coin.type.BTC, user_id)

            return [usdt_trc20, usdt_erc20, btc, eth]
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
         * @param {*} coinType 
         * @returns 
         */
        async tradeAddLog(hash, block, timestamp, amount, ownerAddress, toAddress, coinType) {
            let res
            if (hash) {
                res = await db.Query('SELECT * FROM recharge_log WHERE hash=? LIMIT 1', [hash])
                if (res.length > 0) {
                    return null
                }
            }
            let create_time = utils99.Time()
            console.log('1 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
            console.log(hash, block, ownerAddress, toAddress, amount, timestamp, create_time, coinType)
            res = await db.Query('INSERT INTO recharge_log (hash,block,owner_address,to_address,amount,time,create_time,type) VALUES (?,?,?,?,?,?,?,?)', [hash, block, ownerAddress, toAddress, amount, timestamp, create_time, coinType])

            // 往用户信息里 加币
            let userRes = await service.user.oneByWalletAddress(toAddress)
            console.log('往用户信息里 加币', userRes.id, userRes.email)
            let coin_type = coinType.replace('-', '_')
            let value = Number(userRes[coin_type]) + Number(amount)
            console.log(userRes.id, coin_type, value)
            await service.user.updateOneField(userRes.id, coin_type, value)
            console.log('2 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
            return res
        },
        /**
         * 查询 某用户的交易记录列表
         * @param {*} user_id 
         * @returns 
         */
        async tradeListByUser(user_id) {
            let res = await db.Query('SELECT * FROM system_wallet WHERE bind_user_id=? LIMIT 1', [user_id])
            if (res.length <= 0) {
                return null
            }
            let wallet_address = res[0].wallet_address
            res = await db.Query('SELECT * FROM recharge_log WHERE to_address=? ORDER BY id DESC LIMIT 500', [wallet_address])
            return res
        },
        /**
         * 查询 某用户的交易记录列表 通过 钱包地址
         * @param {*} wallet_address 
         * @returns 
         */
        async tradeListByWalletAddress(wallet_address) {
            let res = await db.Query('SELECT * FROM recharge_log WHERE to_address=? ORDER BY time DESC LIMIT 500', [wallet_address])
            return res
        },
        /**
         * usdt金额总和
         * @returns 
         */
        async coinAmount() {
            let usdt_trc20 = await db.Query('SELECT SUM(recharge_log.amount) AS amount FROM recharge_log WHERE type=? ', [common.coin.type.USDT_TRC20])
            let usdt_erc20 = await db.Query('SELECT SUM(recharge_log.amount) AS amount FROM recharge_log WHERE type=? ', [common.coin.type.USDT_ERC20])
            let eth = await db.Query('SELECT SUM(recharge_log.amount) AS amount FROM recharge_log WHERE type=? ', [common.coin.type.ETH])
            let btc = await db.Query('SELECT SUM(recharge_log.amount) AS amount FROM recharge_log WHERE type=? ', [common.coin.type.BTC])
            return {
                usdt_trc20: usdt_trc20[0].amount || 0,
                usdt_erc20: usdt_erc20[0].amount || 0,
                eth: eth[0].amount || 0,
                btc: btc[0].amount || 0
            }
        },
        /**
         * 钱包总数和已使用数
         * @returns 
         */
        async walletAddressCount() {
            let res = {}
            let o = common.coin.type
            for (let key in o) {
                let total = await db.Query('SELECT COUNT(*) AS count FROM system_wallet WHERE wallet_type=?', [o[key]])
                res[key] = {}
                res[key]['total'] = total[0].count

                let used = await db.Query('SELECT COUNT(0) AS count FROM system_wallet WHERE wallet_type=? AND bind_user_id<>0', [o[key]])
                res[key]['used'] = used[0].count
            }
            return res
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
                if (!tools.isNumber(item[0])) {
                    results.unqualified++
                    results.unqualifiedArr.push(item[0])
                    continue
                }
                // 检查 地址 是否有重复
                let res = await db.Query('SELECT * FROM system_wallet WHERE wallet_address=? LIMIT 1', [item[1]])
                if (res.length > 0) {
                    results.exist++
                    continue
                }
                let upload_user_id = 1
                let bind_user_id = 0
                let wallet_address = item[1]
                let wallet_type = tools.getWalletType(wallet_address)
                let create_datetime = utils99.Time()
                let update_datetime = utils99.Time()
                if (wallet_type == common.coin.type.ETH) {
                    // 当做 usdt-erc20插入
                    await db.Query(`INSERT INTO system_wallet (upload_user_id,bind_user_id,wallet_address,wallet_type,create_datetime,update_datetime) VALUES (?,?,?,?,?,?)`, [
                        upload_user_id,
                        bind_user_id,
                        wallet_address,
                        common.coin.type.USDT_ERC20,
                        create_datetime,
                        update_datetime
                    ])
                }
                await db.Query(`INSERT INTO system_wallet (upload_user_id,bind_user_id,wallet_address,wallet_type,create_datetime,update_datetime) VALUES (?,?,?,?,?,?)`, [
                    upload_user_id,
                    bind_user_id,
                    wallet_address,
                    wallet_type,
                    create_datetime,
                    update_datetime
                ])
                results.success++
            }
            return results
        },
        /**
         * 查询 交易记录
         * @param {*} start 
         * @param {*} limit 
         * @returns 
         */
        async tradeLog(start, limit) {
            let res = await db.Query('SELECT COUNT(0) AS total FROM recharge_log')
            let list = await db.Query('SELECT * FROM recharge_log ORDER BY id DESC LIMIT ?,?', [start, limit])
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
        /**
         * 获取网络浏览器的交易记录
         * @param {*} wallet_address 
         * @returns 'ok' | 'statusText'
         */
        async getInternetTradeLog(wallet_address) {
            let temp_res = await service.wallet.walletAddress(wallet_address)
            let old_time = new Date(temp_res.update_datetime).getTime()
            let new_time = new Date(utils99.Time()).getTime()
            if (old_time + (1000 * 60 * 1) > new_time) {
                // 通过数据库查询 交易记录
                let res = await service.wallet.tradeListByWalletAddress(wallet_address)
                return { data: { token_transfers: res } }
            }

            // tokenview.com 的地址 不稳定
            // https://usdt.tokenview.com/api/usdt/addresstxlist/TUbWM1G6QnjCBfif6hVmJJvKSooBKph5Dn/1/20
            // tronscan.org 交易查询地址
            // https://apilist.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=20&start=0&address=TUbWM1G6QnjCBfif6hVmJJvKSooBKph5Dn
            // tronscan.org 转帐查询
            // https://apilist.tronscan.org/api/token_trc20/transfers?limit=20&start=0&sort=-timestamp&count=true&relatedAddress=TUbWM1G6QnjCBfif6hVmJJvKSooBKph5Dn

            let url = `https://apilist.tronscan.org/api/token_trc20/transfers?limit=20&start=0&sort=-timestamp&count=true&relatedAddress=${wallet_address}`
            console.log('请求URL刷新交易数据：', url)
            let res = await utils99.request.axios.get({ url })
            if (!res || res.statusText.toLowerCase() != 'ok') {
                return null
            }

            // 过滤交易记录 转给自己的写入数据库
            let a = res.data.token_transfers
            for (let i = 0; i < a.length; i++) {
                let item = a[i]
                let o = {
                    hash: item.transaction_id,
                    block: item.block,
                    timestamp: item.block_ts,
                    // todo 入帐时，已除以保留小数位
                    amount: Number(item.quant) / 1000000,
                    ownerAddress: item.from_address,
                    toAddress: item.to_address,
                }

                if (o.toAddress == wallet_address) {
                    // 转入记录日志
                    await service.wallet.tradeAddLog(o.hash, o.block, utils99.Timestamp(o.timestamp), o.amount, o.ownerAddress, o.toAddress, common.coin.type.USDT_TRC20)
                }
            }

            // 更新数据更新时间
            await service.wallet.updateTimeWalletAddress(wallet_address)

            return res
        }
    },
    pageview: {
        /**
         * 浏览量日志
         * @param {*} user_id 
         * @param {*} ip 
         * @param {*} url 
         * @param {*} user_agent 
         */
        async addLog(user_id, ip, referer, url, user_agent) {
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
        },
        /**
         * 清除浏览记录
         * @returns 
         */
        async clear() {
            let res = await db.Query('DELETE FROM page_view_log')
            return res
        }
    },

    // 平台币相关
    currency: {
        async info() {
            let res = await db.Query('SELECT * FROM platform_currency ORDER BY id DESC LIMIT 1')
            return res.length > 0 ? res[0] : null
        },
        async update(icon, symbol, name, value, sort, withdraw_charges, usdt_exchange, eth_exchange, btc_exchange, start_time, end_time, id = 1) {
            let update_datetime = utils99.Time()
            let res = await db.Query(`UPDATE platform_currency SET 
            icon=?,
            symbol=?,
            name=?,
            value=?,
            sort=?,
            withdraw_charges=?,
            usdt_exchange=?,
            eth_exchange=?,
            btc_exchange=?,
            start_time=?,
            end_time=?,
            update_datetime=?
             WHERE id=?`, [icon, symbol, name, value, sort, withdraw_charges, usdt_exchange, eth_exchange, btc_exchange, start_time, end_time, update_datetime, id])
            return res
        },
    },



    // K线图
    kline: kline,
    pricesAssets: ws,
    // 提现操作
    withdraw: withdraw
}


module.exports = service;