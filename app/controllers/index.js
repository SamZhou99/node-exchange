const utils99 = require('node-utils99')
const { init } = require('node-utils99/mysql-sync-cache')
const tools = require('../lib/tools.js')
const lang = require('../../config/language.js')
const config = require('../../config/web.js')
const service = require('../service/index.js')



async function userAdd(ctx, inviteCode, account, password, type, mail, mobile, status, create_datetime, update_datetime) {
    let defLang = ctx.cookies.get('lang')
    if (!account && !mail && !mobile) {
        ctx.body = { flag: lang.list[defLang].page.reg.alert.check_form_whole }
        return
    }
    let user = await service.user.checkAccountExist(account, mail, mobile)
    console.log('checkAccountExistcheckAccountExistcheckAccountExistcheckAccountExistcheckAccountExistcheckAccountExist')
    console.log(user)
    if (user) {
        ctx.body = { flag: lang.list[defLang].page.reg.alert.mail_err }
        return
    }
    let res = await service.inviteCode.findByCode(inviteCode)
    if (!res) {
        ctx.body = { flag: lang.list[defLang].page.reg.alert.invite_code_err }
        return
    }
    await service.user.createNewUser(inviteCode, account, utils99.MD5(password), type, mail, mobile, status, create_datetime, update_datetime)
    ctx.body = { flag: 'ok' }
}




let __this = {
    page: {
        // 首页
        async index(ctx) {
            await ctx.render('page/index', ctx.data)
        },
        // 交易
        async exchange(ctx) {
            await ctx.render('page/exchange', ctx.data)
        },
        // 首发项目
        async startup(ctx) {
            await ctx.render('page/startup', ctx.data)
        },
        // 市场
        async market(ctx) {
            let tag = ctx.params.tag
            console.log('货币标签 如 btc_usdt    : ', tag)
            await ctx.render('page/market', ctx.data)
        },
        // 语言
        async language(ctx) {
            let defLang = ctx.params.lang
            ctx.cookies.set('lang', defLang, {
                // 有效时长999天
                maxAge: 1000 * 60 * 60 * 24 * 999,
                httpOnly: true,
                overwrite: false
            });
            ctx.redirect(`${ctx.request.headers.referer}`);
        },
        // 注册
        reg: {
            async page(ctx) {
                await ctx.render('page/reg', ctx.data)
            },
            async post(ctx) {
                let body = ctx.request.body
                await userAdd(ctx, body.inviteCode, null, body.password, 6, body.mail, null, 1, utils99.Time(), utils99.Time())
            }
        },
        // 登录
        login: {
            async page(ctx) {
                await ctx.render('page/login', ctx.data)
            },
            async post(ctx) {
                let body = ctx.request.body
                let user = await service.user.login(body.mail, body.password)
                if (!user) {
                    // 登录失败
                    let defLang = ctx.cookies.get('lang')
                    ctx.body = { flag: lang.list[defLang].page.login.alert.err }
                    return
                }
                if (user.status === 0) {
                    // 禁用状态
                    let defLang = ctx.cookies.get('lang')
                    ctx.body = { flag: lang.list[defLang].page.login.alert.status }
                    return
                } else if (user.status > 1) {
                    // 大于1的其他状态
                    let defLang = ctx.cookies.get('lang')
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
                let location = user.type <= 4 ? '/admin' : '/me'
                ctx.body = { flag: 'ok', data: { location } }
            }
        },
        // 登出
        logout: {
            async page(ctx) {
                ctx.session = null
                ctx.redirect('/login')
            }
        },
        // // 蜡烛图表
        // chart: {
        //     random(min, max) {
        //         return min + Math.random() * (max - min)
        //     },
        //     async page(ctx) {
        //         await ctx.render('page/chart', ctx.data)
        //     },
        //     async getMarketSpecialtyJson(ctx) {
        //         let a = []
        //         for (let i = 0; i < 300; i++) {
        //             // 0: 1564492500
        //             // 1: 0
        //             // 2: 0
        //             // 3: "9545.00000000"
        //             // 4: "9545.00000000"
        //             // 5: "9545.00000000"
        //             // 6: "9545.00000000"
        //             // 7: "61.36180000"
        //             // a.push([
        //             //     1564492500 + 300 * i,
        //             //     __this.page.chart.random(1, 9),
        //             //     __this.page.chart.random(1, 9),
        //             //     __this.page.chart.random(9535, 9555),
        //             //     __this.page.chart.random(9535, 9555),
        //             //     __this.page.chart.random(9535, 9555),
        //             //     __this.page.chart.random(9535, 9555),
        //             //     __this.page.chart.random(1, 999)
        //             // ])

        //             // var newDate = new Date(firstDate);
        //             // newDate.setDate(newDate.getDate() + i);
        //             let value = 1200
        //             value += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
        //             var open = value + Math.round(Math.random() * 16 - 8);
        //             var low = Math.min(value, open) - Math.round(Math.random() * 5);
        //             var high = Math.max(value, open) + Math.round(Math.random() * 5);

        //             let time = 1564492500 + 1000 * 60 * i
        //             __this.page.chart.currTime = time
        //             a.push([
        //                 time,
        //                 0,
        //                 0,
        //                 // __this.page.chart.random(9535, 9540),
        //                 // __this.page.chart.random(9541, 9549),
        //                 // __this.page.chart.random(9531, 9541),
        //                 // __this.page.chart.random(9535, 9555),
        //                 open,
        //                 high,
        //                 low,
        //                 value,
        //                 __this.page.chart.random(value - 5, value + 5)
        //             ])
        //         }
        //         ctx.body = a
        //     },
        //     currTime: 0,
        //     async getSpecialtyTrades(ctx) {
        //         // console.log(ctx.request.query)
        //         let query = ctx.request.query
        //         // ctx.body = [{ tid: 54, date: query.nonce, price: __this.page.chart.random(9030 - 19, 9536.5575 + 90), amount: 0, trade_type: "bid" }]
        //         let n = 50
        //         let price = __this.page.chart.random(1200 - n, 1200 + n)
        //         console.log(__this.page.chart.currTime, query.nonce, price)
        //         let date = query.nonce
        //         ctx.body = [{ tid: 54, date: date, price: price, amount: 0, trade_type: "bid" }]
        //     },
        // },


        // 帮助中心
        help: {
            async userGreement(ctx) {
                await ctx.render('page/help/user_greement', ctx.data)
            }
        },




        // api
        api: {
            post: {
                async startup(ctx) {
                    let form = ctx.request.body
                    let user_id = ctx.session.user.id
                    ctx.body = { flag: 'ok', data: { form, user_id } }
                },
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
                    user.wallet = await service.user.userDetailInfo(user)
                }
                ctx.body = { flag: 'ok', data: { user, currency } }
            },
        },



        // 我的资产
        me: {
            async page(ctx) {
                let res = await service.user.walletAddress(ctx.session['user'].id)
                ctx.data.session = ctx.session
                ctx.data.wallet_address = res.wallet_address
                await ctx.render('page/me/index', ctx.data)
            },
            // 邀请好友
            async inviteFriends(ctx) {
                let user_id = ctx.session['user'].id
                let res = await service.user.inviteCode(user_id)
                ctx.data.invite_code = res.code
                ctx.data.config = config
                ctx.data.session = ctx.session
                await ctx.render('page/me/invite_friends', ctx.data)
            },
            // 登录日志
            async loginLog(ctx) {
                let user_id = ctx.session['user'].id
                let res = await service.user.logoLogList(user_id)
                ctx.data.loginLog = res
                ctx.data.session = ctx.session
                await ctx.render('page/me/login_log', ctx.data)
            },
            async withdraw(ctx) {
                ctx.data.session = ctx.session
                await ctx.render('page/me/withdraw', ctx.data)
            }
        },



        // 管理面板
        admin: {
            // 首页
            async index(ctx) {
                ctx.redirect('/admin/dashboard')
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

            // 
            api: {
                post: {
                    async userAddJson(ctx) {
                        let form = ctx.request.body
                        await userAdd(ctx, form.inviteCode, form.account, form.password, form.type, form.mail, form.mobile, form.status, utils99.Time(), utils99.Time())
                    },
                    async updateStartupJson(ctx) {
                        let form = ctx.request.body
                        let res = await service.currency.update(form.icon, form.name, form.value, form.withdraw_charges, form.usdt_exchange, form.eth_exchange, form.btc_exchange, form.start_time, form.end_time, form.id)
                        ctx.body = { flag: 'ok', data: res }
                    },
                    async manualAddScoreJson(ctx) {
                        let form = ctx.request.body

                        if (form.btc > 0) {
                            let amount = form.btc
                            let wallet_address = form.btc_wallet_address
                            let coin_type = tools.getWalletType(wallet_address)
                            let res = await service.wallet.tradeAddLog('', '', utils99.Time(), amount, '', wallet_address, coin_type)
                        }

                        if (form.eth > 0) {
                            let amount = form.eth
                            let wallet_address = form.eth_wallet_address
                            let coin_type = tools.getWalletType(wallet_address)
                            let res = await service.wallet.tradeAddLog('', '', utils99.Time(), amount, '', wallet_address, coin_type)
                        }

                        if (form.usdt > 0) {
                            let amount = form.usdt
                            let wallet_address = form.usdt_wallet_address
                            let coin_type = tools.getWalletType(wallet_address)
                            let res = await service.wallet.tradeAddLog('', '', utils99.Time(), amount, '', wallet_address, coin_type)
                        }

                        ctx.body = { flag: 'ok', form }
                    },
                },
                async init(ctx) {
                    let test = require('../../temp/temp/test-init.js')
                    await test.init()
                    ctx.body = { flag: 'ok' }
                },
                async dashboardJson(ctx) {
                    let userCount = await service.user.count()
                    let usdtCount = await service.wallet.usdtAmount()
                    let walletAddressCount = await service.wallet.walletAddressCount()
                    let pageViewCount = await service.pageview.count()

                    ctx.body = { flag: 'ok', data: { userCount, usdtCount, walletAddressCount, pageViewCount } }
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