const utils99 = require('node-utils99')
const { init } = require('node-utils99/mysql-sync-cache')
const tools = require('../lib/tools.js')
const lang = require('../../config/language.js')
const config = require('../../config/web.js')
const common = require('../../config/common.js')
const service = require('../service/index.js')



async function userAdd(ctx, inviteCode, account, password, type, mail, mobile, status, create_datetime, update_datetime) {
    let defLang = getDefaultLanguage(ctx)
    // 检查帐号，邮箱是否有值
    if (!account && !mail && !mobile) {
        ctx.body = { flag: lang.list[defLang].page.reg.alert.check_form_whole }
        return
    }
    // 检查是否帐号重复
    let user = await service.user.checkAccountExist(account, mail, mobile)
    if (user) {
        ctx.body = { flag: lang.list[defLang].page.reg.alert.mail_err }
        return
    }
    // 检查用户输入的邀请码是否存在，如果不存在，就默认为系统的用户。
    let res = await service.inviteCode.findByCode(inviteCode)
    if (!res) {
        // ctx.body = { flag: lang.list[defLang].page.reg.alert.invite_code_err }
        // return
        inviteCode = '!@#$'
    }
    // 创建帐户
    await service.user.createNewUser(inviteCode, account, utils99.MD5(password), type, mail, mobile, status, create_datetime, update_datetime)
    ctx.body = { flag: 'ok' }
}


function getDefaultLanguage(ctx) {
    let defLang = ctx.cookies.get('lang')
    return defLang || lang.default
}


function deviceTemplatePath(ctx) {
    return ctx.data.isMobile ? 'mobile' : 'page'
}


let __this = {
    page: {
        // 首页
        async index(ctx) {
            await ctx.render(deviceTemplatePath(ctx) + '/index', ctx.data)
        },
        // 交易
        async exchange(ctx) {
            await ctx.render(deviceTemplatePath(ctx) + '/exchange', ctx.data)
        },
        // 首发项目
        async startup(ctx) {
            await ctx.render(deviceTemplatePath(ctx) + '/startup', ctx.data)
        },
        // 市场
        async market(ctx) {
            let query = ctx.request.query
            ctx.data.query = query
            await ctx.render(deviceTemplatePath(ctx) + '/market', ctx.data)
        },
        // 语言
        async language(ctx) {
            let defLang = ctx.params.lang
            if (!lang.list[defLang]) {
                ctx.redirect(`/`);
                return
            }
            ctx.cookies.set('lang', defLang, {
                // 有效时长999天
                maxAge: 1000 * 60 * 60 * 24 * 999,
                httpOnly: true,
                overwrite: false
            });
            if (!ctx.request.headers.referer) {
                ctx.redirect(`/`);
                return
            }
            ctx.redirect(`${ctx.request.headers.referer}`);
        },
        // 语言
        async languageJson(ctx) {
            let defLang = ctx.params.lang
            if (lang.list[defLang] == undefined) {
                defLang = lang.default
            }
            console.log('lang.list[defLang]', lang.list[defLang] == undefined, defLang)
            let language = JSON.parse(JSON.stringify(lang))
            language.list = {}
            language.list[defLang] = lang.list[defLang]
            ctx.cookies.set('lang', defLang, {
                // 有效时长999天
                maxAge: 1000 * 60 * 60 * 24 * 999,
                httpOnly: true,
                overwrite: false
            });
            ctx.body = { flag: 'ok', language }
        },
        // 注册
        reg: {
            async page(ctx) {
                await ctx.render(deviceTemplatePath(ctx) + '/reg', ctx.data)
            },
            async post(ctx) {
                let body = ctx.request.body
                await userAdd(ctx, body.inviteCode, null, body.password, 6, body.mail, null, 1, utils99.Time(), utils99.Time())
            }
        },
        // 登录
        login: {
            async test(ctx) {
                // const buff = Buffer.from(ctx.request.query.hash, 'utf-8');
                // const base64 = buff.toString('base64');
                if (!ctx.request.query.hash) {
                    ctx.body = { flag: 'error' }
                    return
                }
                const buff = Buffer.from(ctx.request.query.hash, 'base64');
                const form = JSON.parse(buff.toString('utf-8'));
                // let user = await service.user.login(form.main, form.password)
                // ctx.session['isLogin'] = true
                // ctx.session['user'] = user
                // ctx.body = { flag: 'ok' }
                await __this.page.login.actLogin(ctx, form)
            },
            async page(ctx) {
                await ctx.render(deviceTemplatePath(ctx) + '/login', ctx.data)
            },
            async post(ctx) {
                let body = ctx.request.body
                await __this.page.login.actLogin(ctx, body)
            },
            async actLogin(ctx, body) {
                let user = await service.user.login(body.mail, body.password)
                if (!user) {
                    // 登录失败
                    let defLang = getDefaultLanguage(ctx)
                    ctx.body = { flag: lang.list[defLang].page.login.alert.err }
                    return
                }
                if (user.status === 0) {
                    // 禁用状态
                    let defLang = getDefaultLanguage(ctx)
                    ctx.body = { flag: lang.list[defLang].page.login.alert.status }
                    return
                } else if (user.status > 1) {
                    // 大于1的其他状态
                    let defLang = getDefaultLanguage(ctx)
                    ctx.body = { flag: lang.list[defLang].page.login.alert.err }
                    return
                }
                // 写入登录日志 UserAgent,IP,
                let userAgent = ctx.request.header['user-agent']
                let ip = utils99.getIP(ctx.req).replace('::ffff:', '')
                await service.user.addLoginLog(user.id, userAgent, ip)
                // 记录session
                ctx.session['isLogin'] = true
                ctx.session['user'] = user
                // console.log('session login session login session login session login session login session login session login ')
                // console.log(ctx.session)
                // 响应
                let location = '/me'
                ctx.body = { flag: 'ok', data: { location, user } }
            }
        },
        // 登出
        logout: {
            async page(ctx) {
                ctx.session = null
                ctx.body = { flag: 'ok' }
                // ctx.redirect('/login')
            }
        },
        // 帮助中心
        help: {
            async userGreement(ctx) {
                await ctx.render(deviceTemplatePath(ctx) + '/help/user_greement', ctx.data)
            }
        },




        // api
        api: {
            post: {
                async changePassword(ctx) {
                    const user_id = ctx.session.user.id
                    const res = await service.user.updateOneField(user_id, 'password', utils99.MD5(ctx.request.body.password1))
                    ctx.body = { flag: 'ok', data: res }
                },
                async startup(ctx) {
                    const form = ctx.request.body
                    const user_id = ctx.session.user.id
                    const coin_amount = form.coin_amount
                    const coin_price = form.coin_price
                    const coin_type = form.coin_type
                    const target_amount = form.target_amount

                    let user = await service.user.oneById(user_id)
                    let user_balance = user[coin_type]
                    if (!user_balance) {
                        // 错误的币种
                        ctx.body = { flag: `wrong ${coin_type}.` }
                        return
                    }
                    if (user_balance < coin_amount) {
                        // 余额不足
                        ctx.body = { flag: `${coin_type}:not sufficient funds.` }
                        return
                    }

                    let res = await service.user.buyLog(user_id, target_amount, user_balance, coin_amount, coin_price, coin_type)
                    ctx.body = { flag: 'ok', data: { form, user_id, res } }
                },
                /**
                 * 更新认证信息
                 * @param {*} ctx 
                 * @returns 
                 */
                async updateAuthentication(ctx) {
                    const user_id = ctx.session.user.id
                    const form = ctx.request.body
                    if (!form.country || !form.full_name || !form.id_number) {
                        ctx.body = { flag: 'Please fill out the form completely!' }
                        return
                    }
                    const status = 1
                    const res = await service.user.saveAuthenticationInfo(user_id, status, form.country, form.full_name, form.id_number)
                    ctx.body = { flag: 'ok', data: res }
                },
            },

            // 我的基本信息
            async meJson(ctx) {
                const user_id = ctx.session.user.id
                const res = await service.user.oneById(user_id)
                ctx.body = { flag: 'ok', data: res }
            },

            //我的钱包
            async walletJson(ctx) {
                let user_id = ctx.session['user'].id
                let user = await service.user.oneById(user_id)
                // let userDetailInfo = await service.user.userDetailInfo(user)
                ctx.body = { flag: 'ok', data: { user_id, user } }
            },
            // 获取系统绑定的钱包地址
            async walletAddressJson(ctx) {
                let wallet_address = ctx.params.wallet_address
                if (!wallet_address) {
                    ctx.body = { flag: 'Missing Parameters' }
                    return
                }
                // 通过网上的数据，查询交易记录
                let res = await service.wallet.getInternetTradeLog(wallet_address)
                if (!res) {
                    ctx.body = { flag: 'Abnormal Condition!' }
                    return
                }
                ctx.body = { flag: 'ok', data: res.data }
            },
            // 邀请列表
            async inviteListJson(ctx) {
                let list = await service.user.inviteList(ctx.params.user_id)
                ctx.body = { flag: 'ok', data: list }
            },
            // 交易列表
            async tradeListByUserJson(ctx) {
                let list = await service.wallet.tradeListByUser(ctx.params.user_id)
                ctx.body = { flag: 'ok', data: list }
            },
            // 邀请 和 交易 列表
            async inviteAndTradeListJson(ctx) {
                let list = await service.user.inviteList(ctx.params.user_id)
                for (let i = 0; i < list.length; i++) {
                    list[i]['trade'] = await service.wallet.tradeListByUser(list[i].id)
                }
                ctx.body = { flag: 'ok', data: list }
            },
            // 首发项目
            async startup(ctx) {
                let currency = await service.currency.info()
                currency.curr_time = utils99.Time()
                let user
                if (ctx.session.isLogin) {
                    user = await service.user.oneById(ctx.session.user.id)
                    await service.user.userDetailInfo(user)
                }
                ctx.body = { flag: 'ok', data: { user, currency } }
            },
            // K线图数据
            async kline(ctx) {
                let query = ctx.request.query
                let symbol = query.symbol || 'btcusdt'
                let period = query.period || '1day'
                let size = query.size || '500'

                let currency = await service.currency.info()
                if (currency.symbol.toLocaleLowerCase() == symbol.substr(0, symbol.length - 4)) {
                    // 平台币
                    let kline = await service.kline.platform_currency(symbol, period, size)
                    ctx.body = { flag: 'ok', data: kline }
                    return;
                }

                let kline = await service.kline.get(symbol, period, size)
                ctx.body = { flag: 'ok', data: kline }
            },
            // 获取缓存数据
            async caches(ctx) {
                let key = ctx.params.key
                let query = ctx.request.query
                let data = await service.pricesAssets.get(key)
                if (data) {
                    data.value = JSON.parse(data.value)
                }
                ctx.body = { flag: 'ok', data }
            },
            async uploadFileJson(ctx) {
                const user_id = ctx.session.user.id
                const file = ctx.request.files.file
                if (file.type.indexOf('image') == -1) {
                    ctx.body = { flag: 'Not a picture, upload file type error!' }
                    return
                }
                let filename = await service.user.uploadPhoto(user_id, file)
                ctx.body = { flag: 'ok', data: { user_id, filename } }
            },
            async authenticationJson(ctx) {
                let user_id = ctx.session.user.id
                if (ctx.request.query.user_id) {
                    user_id = ctx.request.query.user_id
                }
                let res = await service.user.userAuthenticationInfo(user_id)
                ctx.body = { flag: 'ok', data: res }
            },

            // 提币操作
            withdraw: {
                // 提币记录
                async logJson(ctx) {
                    const user_id = ctx.session.user.id
                    const res = await service.withdraw.list(user_id)
                    for (let i = 0; i < res.length; i++) {
                        res[i]['user'] = await service.user.oneById(res[i].user_id)
                    }
                    ctx.body = { flag: 'ok', data: res }
                },
                // 提币申请
                async applyForJson(ctx) {
                    const form = ctx.request.body
                    const status = 1 // 提币状态：0无状态，1申请提币，2驳回，3通过，4提现成功
                    const user_id = form.user_id
                    const apply_amount = Math.abs(form.apply_amount) // 取绝对值
                    const real_amount = Math.abs(form.real_amount)
                    const charges = Math.abs(form.charges)
                    const type = form.type
                    const address = form.address

                    const user = await service.user.oneById(user_id)
                    if (!user) {
                        ctx.body = { flag: 'code:1001. User parameters are abnormal.' }
                        return
                    }
                    if (user[type] == null || user[type] == undefined) {
                        ctx.body = { flag: 'code:1010. User parameters are abnormal.' }
                        return
                    }
                    if (user[type] < apply_amount) {
                        ctx.body = { flag: 'Insufficient user balance.' }
                        return
                    }

                    let balance = user[type] - apply_amount
                    await service.user.updateOneField(user_id, type, balance)
                    await service.withdraw.applyFor(user_id, status, apply_amount, real_amount, charges, type, address)
                    ctx.body = { flag: 'ok' }
                },
                // 提币 状态更新
                async updateJson(ctx) {
                    const form = ctx.request.body
                    const id = form.id
                    const user_id = form.user_id
                    const status = form.status
                    const type = form.type
                    const apply_amount = Math.abs(form.apply_amount)
                    const failed_reason = form.failed_reason || ''

                    const withdraw = await service.withdraw.oneById(id)
                    // 从【提交申请】状态，更改为【驳回】状态时，退回币数量
                    console.log('从【提交申请】状态，更改为【驳回】状态时，退回币数量')
                    console.log(withdraw.status, status)
                    if (withdraw.status == 1 && status == 2) {
                        const user = await service.user.oneById(user_id)
                        let balance = user[type] + apply_amount
                        await service.user.updateOneField(user_id, type, balance)
                    }
                    // 更新 状态和原因
                    const res = await service.withdraw.updateStatus(id, status, failed_reason)
                    ctx.body = { flag: 'ok' }
                }
            }
        },



        // 我的资产
        me: {
            async page(ctx) {
                let res = await service.user.walletAddress(ctx.session['user'].id)
                ctx.data.session = ctx.session
                ctx.data.wallet_address = res.wallet_address
                await ctx.render(deviceTemplatePath(ctx) + '/me/index', ctx.data)
            },
            // 邀请好友
            async inviteFriends(ctx) {
                let user_id = ctx.session['user'].id
                let res = await service.user.inviteCode(user_id)
                ctx.data.invite_code = res.code
                ctx.data.config = config
                ctx.data.session = ctx.session
                await ctx.render(deviceTemplatePath(ctx) + '/me/invite_friends', ctx.data)
            },
            // 登录日志
            async loginLog(ctx) {
                let user_id = ctx.session['user'].id
                let res = await service.user.logoLogList(user_id)
                ctx.data.loginLog = res
                ctx.data.session = ctx.session
                await ctx.render(deviceTemplatePath(ctx) + '/me/login_log', ctx.data)
            },
            // 提现
            async withdraw(ctx) {
                ctx.data.session = ctx.session
                await ctx.render(deviceTemplatePath(ctx) + '/me/withdraw', ctx.data)
            },
            // 用户认证
            async authentication(ctx) {
                ctx.data.session = ctx.session
                await ctx.render(deviceTemplatePath(ctx) + '/me/authentication', ctx.data)
            },
            async changePassword(ctx) {
                ctx.data.session = ctx.session
                await ctx.render(deviceTemplatePath(ctx) + '/me/change_password', ctx.data)
            },
        },



        // 管理面板
        admin: {
            // 首页
            index: {
                async page(ctx) {
                    await ctx.render('admin/login', ctx.data)
                },
                async post(ctx) {
                    const body = ctx.request.body
                    await __this.page.login.actLogin(ctx, body)
                }
            },
            // 统计表首页 
            async dashboard(ctx) {
                await ctx.render('admin/dashboard', ctx.data)
            },
            // 用户列表
            async userList(ctx) {
                await ctx.render('admin/user_list', ctx.data)
            },
            // 添加用户
            async userAdd(ctx) {
                await ctx.render('admin/user_add', ctx.data)
            },
            // 用户认证
            async userAuth(ctx) {
                const authInfo = await service.user.userAuthenticationInfo(ctx.params.user_id)
                ctx.data.authInfo = authInfo
                await ctx.render('admin/user_auth', ctx.data)
            },
            // 系统钱包
            async systemWallet(ctx) {
                await ctx.render('admin/system_wallet', ctx.data)
            },
            // 系统钱包
            async systemWallet(ctx) {
                await ctx.render('admin/system_wallet', ctx.data)
            },
            // 上传系统钱包地址
            async uploadWalletAddress(ctx) {
                await ctx.render('admin/upload_wallet_address', ctx.data)
            },
            // 交易记录
            async tradeLog(ctx) {
                await ctx.render('admin/trade_log', ctx.data)
            },
            // 浏览记录
            async pageview(ctx) {
                await ctx.render('admin/pageview', ctx.data)
            },
            // 市场 添加货币
            async marketCoin(ctx) {
                await ctx.render('admin/martket_coin', ctx.data)
            },
            // 市场 涨跌
            async marketChange(ctx) {
                await ctx.render('admin/martket_change', ctx.data)
            },
            // 人工上分
            async manualAddScore(ctx) {
                await ctx.render('admin/manual_add_score', ctx.data)
            },
            // 提币
            async withdraw(ctx) {
                await ctx.render('admin/withdraw', ctx.data)
            },

            // 
            api: {
                post: {
                    async userAddJson(ctx) {
                        let form = ctx.request.body
                        await userAdd(ctx, form.inviteCode, form.account, form.password, form.type, form.mail, form.mobile, form.status, utils99.Time(), utils99.Time())
                    },
                    async updateStartupJson(ctx) {
                        let form = ctx.request.body
                        let res = await service.currency.update(form.icon, form.symbol, form.name, form.value, form.sort, form.withdraw_charges, form.usdt_exchange, form.eth_exchange, form.btc_exchange, form.start_time, form.end_time, form.id)
                        ctx.body = { flag: 'ok', data: res }
                    },
                    async manualAddScoreJson(ctx) {
                        let form = ctx.request.body
                        let user_id = form.id
                        let operator_id = ctx.session.user.id

                        if (form.btc > 0) {
                            let amount = Math.abs(form.btc)
                            let wallet_address = form.btc_wallet_address
                            let coin_type = common.coin.type.BTC
                            // hash, block, timestamp, amount, ownerAddress, toAddress, coinType, operator_id, user_id, action, notes
                            let res = await service.wallet.tradeAddLog('', 0, utils99.Time(), amount, '', wallet_address, coin_type, operator_id, user_id, form.action, form.notes)
                        }

                        if (form.eth > 0) {
                            let amount = Math.abs(form.eth)
                            let wallet_address = form.eth_wallet_address
                            let coin_type = common.coin.type.ETH
                            let res = await service.wallet.tradeAddLog('', 0, utils99.Time(), amount, '', wallet_address, coin_type, operator_id, user_id, form.action, form.notes)
                        }

                        if (form.usdt_trc20 > 0) {
                            let amount = Math.abs(form.usdt_trc20)
                            let wallet_address = form.usdt_trc20_wallet_address
                            let coin_type = common.coin.type.USDT_TRC20
                            let res = await service.wallet.tradeAddLog('', 0, utils99.Time(), amount, '', wallet_address, coin_type, operator_id, user_id, form.action, form.notes)
                        }

                        if (form.usdt_erc20 > 0) {
                            let amount = Math.abs(form.usdt_erc20)
                            let wallet_address = form.usdt_erc20_wallet_address
                            let coin_type = common.coin.type.USDT_ERC20
                            let res = await service.wallet.tradeAddLog('', 0, utils99.Time(), amount, '', wallet_address, coin_type, operator_id, user_id, form.action, form.notes)
                        }


                        // 平台币上分
                        if (form.platform_currency > 0) {
                            let target_amount = Math.abs(form.platform_currency)
                            let coin_price = 1 / Number(form.platform_currency_price)
                            // user_id, target_amount, user_balance = 0, coin_amount = 0, coin_price = 0, coin_type = '', operator_id = 0, action = 'add', notes = ''
                            let res = await service.user.buyLog(user_id, target_amount, 0, 0, coin_price, common.coin.type.USDT_TRC20, operator_id, form.action, form.notes)
                        }

                        ctx.body = { flag: 'ok', form }
                    },
                    async saveKLineDataJson(ctx) {
                        let body = ctx.request.body
                        let symbol = body.symbol || 'lethusdt'
                        let chartData = body.chartData || '[]'
                        console.log(body)
                        let data = {
                            "ch": "market." + symbol + ".kline.1day",
                            "status": "ok",
                            "ts": new Date().getTime(),
                            "data": JSON.parse(chartData)
                        }
                        await service.kline.saveKlineData(symbol, data)
                        ctx.body = { flag: 'ok' }
                    },
                    async updateAuthentication(ctx) {
                        const form = ctx.request.body
                        if (!form.country || !form.full_name || !form.id_number || !form.user_id || !form.status) {
                            ctx.body = { flag: 'Please fill out the form completely!' }
                            return
                        }
                        const res = await service.user.saveAuthenticationInfo(form.user_id, form.status, form.country, form.full_name, form.id_number, form.failed_reason)
                        ctx.body = { flag: 'ok', data: res }
                    },
                },
                async init(ctx) {
                    let test = require('../../temp/temp/test-init.js')
                    await test.init()
                    ctx.body = { flag: 'ok' }
                },
                async dashboardJson(ctx) {
                    let userCount = await service.user.count()
                    let coinAmount = await service.wallet.coinAmount()
                    let walletAddressCount = await service.wallet.walletAddressCount()
                    let pageViewCount = await service.pageview.count()

                    ctx.body = { flag: 'ok', data: { userCount, coinCount: coinAmount, walletAddressCount, pageViewCount } }
                },
                async userListJson(ctx) {
                    let list = await service.user.list()
                    ctx.body = { flag: 'ok', data: { list } }
                },
                async userGroupCategoryJson(ctx) {
                    let list = await service.user.groupCategory()
                    ctx.body = { flag: 'ok', data: { list } }
                },
                async userUpdateOneFieldJson(ctx) {
                    let id = ctx.request.query.id
                    let field = ctx.request.query.field
                    let value = ctx.request.query.value
                    let res = await service.user.updateOneField(id, field, value)
                    ctx.body = { flag: 'ok', data: res }
                },
                async walletListJson(ctx) {
                    let q = ctx.request.query
                    let limit = q.limit ? parseInt(q.limit) : 20
                    let page = q.page ? parseInt(q.page) : 1
                    let start = limit * (page - 1)
                    let res = await service.wallet.list(start, limit)
                    ctx.body = {
                        flag: 'ok', data: {
                            list: res.list,
                            page: {
                                page,
                                limit,
                                total: res.total
                            }
                        }
                    }
                },
                async uploadFileJson(ctx) {
                    const file = ctx.request.files.file
                    if (file.type != 'text/csv') {
                        ctx.body = { flag: '非 xxx.csv 。上传文件类型错误！' }
                        return
                    }
                    let res = await service.wallet.importCSV(file.path)
                    ctx.body = { flag: 'ok', data: res }
                },
                async tradeLogJson(ctx) {
                    let q = ctx.request.query
                    let limit = q.limit ? parseInt(q.limit) : 20
                    let page = q.page ? parseInt(q.page) : 1
                    let start = limit * (page - 1)
                    let res = await service.wallet.tradeLog(start, limit)
                    ctx.body = {
                        flag: 'ok', data: {
                            list: res.list,
                            page: {
                                page,
                                limit,
                                total: res.total
                            }
                        }
                    }
                },
                async pageviewJson(ctx) {
                    let q = ctx.request.query
                    let limit = q.limit ? parseInt(q.limit) : 20
                    let page = q.page ? parseInt(q.page) : 1
                    let start = limit * (page - 1)
                    let res = await service.pageview.list(start, limit)
                    ctx.body = {
                        flag: 'ok',
                        data: {
                            list: res.list,
                            page: {
                                page,
                                limit,
                                total: res.total
                            }
                        }
                    }
                },
                async pageviewClearJson(ctx) {
                    let res = await service.pageview.clear()
                    ctx.body = { flag: 'ok', data: res }
                },

            }
        }
    },
}


module.exports = __this




// console.log(ctx.request.body)
// console.log(ctx.request.query)
// console.log(ctx.params)