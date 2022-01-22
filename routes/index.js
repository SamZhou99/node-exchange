const router = new require('koa-router')()
const middleware = require('../app/middleware/index.js')
const { page: controllers } = require('../app/controllers/index.js')




// // 验证码
// router.get('/api/verificatcode', page.verificatcode) 


// 首页
router.get('/', middleware.commmonData, controllers.index)
// 设置显示语言
router.get('/language/:lang.json', middleware.commmonData, controllers.languageJson)
router.get('/language/:lang', middleware.commmonData, controllers.language)
// 注册
router.get('/reg', middleware.commmonData, controllers.reg.page)
router.post('/reg', middleware.commmonData, controllers.reg.post)
// 登录
router.get('/login', middleware.commmonData, controllers.login.page)
router.get('/login/test', middleware.commmonData, controllers.login.test)
router.post('/login', middleware.commmonData, controllers.login.post)
// 登出
router.get('/logout', middleware.commmonData, controllers.logout.page)


// 市场行情
router.get('/market', middleware.commmonData, controllers.market)
// 币币交易
router.get('/exchange', middleware.commmonData, controllers.exchange)
// 首发项目
router.get('/startup', middleware.commmonData, controllers.startup)
// 帮助中心
router.get('/help', middleware.commmonData, controllers.index)
router.get('/help/user-greement', middleware.commmonData, controllers.help.userGreement)
// 关于我们
router.get('/about', middleware.commmonData, controllers.index)
// 服务中心
router.get('/service', middleware.commmonData, controllers.index)
// 条款说明
router.get('/clause', middleware.commmonData, controllers.index)
// // 蜡烛图表
// router.get('/chart', middleware.commmonData, controllers.chart.page)
// router.get('/chart/getMarketSpecialtyJson.html', middleware.commmonData, controllers.chart.getMarketSpecialtyJson)
// router.get('/chart/getSpecialtyTrades.html', middleware.commmonData, controllers.chart.getSpecialtyTrades)


// 我的资产
router.get('/me', middleware.commmonData, middleware.checkLogin, controllers.me.page)
// 我的邀请码
router.get('/me/invite-friends', middleware.commmonData, middleware.checkLogin, controllers.me.inviteFriends)
// 登录日志
router.get('/me/login-log', middleware.commmonData, middleware.checkLogin, controllers.me.loginLog)
// 资产转出
router.get('/me/withdraw', middleware.commmonData, middleware.checkLogin, controllers.me.withdraw)
// 身份认证
router.get('/me/authentication', middleware.commmonData, middleware.checkLogin, controllers.me.authentication)
// 修改密码
router.get('/me/change-password', middleware.commmonData, middleware.checkLogin, controllers.me.changePassword)
router.post('/me/change-password', middleware.commmonData, middleware.checkLogin, controllers.api.post.changePassword)

// router.get('/me/finance', middleware.checkLogin, controllers.index)
// // 资产转入
// router.get('/me/deposit', middleware.checkLogin, controllers.index)

// // 委托管理
// router.get('/me/entrust', middleware.checkLogin, controllers.index)
// // 成交查询
// router.get('/me/transactions', middleware.checkLogin, controllers.index)
// // 我的分红
// router.get('/me/dividend', middleware.checkLogin, controllers.index)
// // 邀请奖励
// router.get('/me/inviting', middleware.checkLogin, controllers.index)
// // 安全中心
// router.get('/me/security', middleware.checkLogin, controllers.index)


// Me API
// 我的钱包列表
router.get('/api/wallet', middleware.checkLogin, controllers.api.walletJson)
// 钱包地址，交易记录
router.get('/api/wallet-address/:wallet_address', middleware.checkLogin, controllers.api.walletAddressJson)
// 邀请列表
router.get('/api/invite-list/:user_id', middleware.checkLogin, controllers.api.inviteListJson)
// 交易列表
router.get('/api/trade-list/:user_id', middleware.checkLogin, controllers.api.tradeListByUserJson)
// 邀请交易列表(上面两个接口合二为一)
router.get('/api/invite-trade-list/:user_id', middleware.checkLogin, controllers.api.inviteAndTradeListJson)
// 首发项目
router.get('/api/startup', middleware.commmonData, controllers.api.startup)
router.post('/api/startup', middleware.checkLogin, controllers.api.post.startup)
// KLineChart
router.get('/api/kline', middleware.commmonData, controllers.api.kline)
// 获取缓存数据
router.get('/api/:key/caches', middleware.commmonData, controllers.api.caches)
// 上传身份照片
router.post('/api/upload-file', middleware.checkLogin, controllers.api.uploadFileJson)
// 获取用户认证信息
router.get('/api/authentication', middleware.checkLogin, controllers.api.authenticationJson)
// 更新认证信息
router.post('/api/update-authentication', middleware.checkLogin, controllers.api.post.updateAuthentication)

// 提币申请
router.post('/api/withdraw-applyfor', middleware.checkLogin, controllers.api.withdraw.applyForJson)
// 提币记录
router.get('/api/withdraw-log', middleware.checkLogin, controllers.api.withdraw.logJson)
// 我的信息
router.get('/api/me', middleware.checkLogin, controllers.api.meJson)

// 代理
router.get('/api/proxy', controllers.api.proxy.get)

// // 用户列表
// router.get('/api/user-list', middleware.checkLogin, controllers.api.userListJson)








module.exports = { router }