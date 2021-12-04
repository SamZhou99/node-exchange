const router = new require('koa-router')()
const middleware = require('../app/middleware/index.js')
const { page: controllers } = require('../app/controllers/index.js')




// // 验证码
// router.get('/api/verificatcode', page.verificatcode) 


// 首页
router.get('/', middleware.commmonData, controllers.index)
// 设置显示语言
router.get('/language/:lang', middleware.commmonData, controllers.language)
// 注册
router.get('/reg', middleware.commmonData, controllers.reg.page)
router.post('/reg', middleware.commmonData, controllers.reg.post)
// 登录
router.get('/login', middleware.commmonData, controllers.login.page)
router.post('/login', middleware.commmonData, controllers.login.post)
// 登出
router.get('/logout', middleware.commmonData, controllers.logout.page)


// 市场行情
router.get('/market/:tag', middleware.commmonData, controllers.market)
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
router.get('/me', middleware.checkLogin, controllers.me.page)
// 我的邀请码
router.get('/me/invite-friends', middleware.checkLogin, controllers.me.inviteFriends)
// 登录日志
router.get('/me/login-log', middleware.checkLogin, controllers.me.loginLog)


// router.get('/me/finance', middleware.checkLogin, controllers.index)
// // 资产转入
// router.get('/me/deposit', middleware.checkLogin, controllers.index)
// 资产转出
router.get('/me/withdraw', middleware.checkLogin, controllers.me.withdraw)
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


// API
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



// // 用户列表
// router.get('/api/user-list', middleware.checkLogin, controllers.api.userListJson)


// 管理首页
router.get('/admin', middleware.checkLogin, middleware.role, controllers.admin.index)
// 仪表面板
router.get('/admin/dashboard', middleware.checkLogin, middleware.role, controllers.admin.dashboard)
// 用户列表
router.get('/admin/user-list', middleware.checkLogin, middleware.role, controllers.admin.userList)
router.get('/admin/user-add', middleware.checkLogin, middleware.role, controllers.admin.userAdd)
// 系统钱包
router.get('/admin/system-wallet', middleware.checkLogin, middleware.role, controllers.admin.systemWallet)
router.get('/admin/upload-wallet-address', middleware.checkLogin, middleware.role, controllers.admin.uploadWalletAddress)
router.get('/admin/trade-log', middleware.checkLogin, middleware.role, controllers.admin.tradeLog)
// 浏览记录
router.get('/admin/pageview', middleware.checkLogin, middleware.role, controllers.admin.pageview)
// 行情
// 添加货币
router.get('/admin/market-coin', middleware.checkLogin, middleware.role, controllers.admin.marketCoin)
// 控制涨跌
router.get('/admin/market-change', middleware.checkLogin, middleware.role, controllers.admin.marketChange)
// 人工上分
router.get('/admin/manual-add-score', middleware.checkLogin, middleware.role, controllers.admin.manualAddScore)


// /admin/coin-add
// /admin/coin-edit
// admin api
router.get('/admin/api/dashboard', middleware.checkLogin, middleware.role, controllers.admin.api.dashboardJson)
router.get('/admin/api/user-list', middleware.checkLogin, middleware.role, controllers.admin.api.userListJson)
router.post('/admin/api/user-add', middleware.checkLogin, middleware.role, controllers.admin.api.post.userAddJson)
router.get('/admin/api/user-group-category', middleware.checkLogin, middleware.role, controllers.admin.api.userGroupCategoryJson)
router.get('/admin/api/user/update-one-field', middleware.checkLogin, middleware.role, controllers.admin.api.userUpdateOneFieldJson)
router.get('/admin/api/wallet-list', middleware.checkLogin, middleware.role, controllers.admin.api.walletListJson)
router.post('/admin/api/upload-file', middleware.checkLogin, middleware.role, controllers.admin.api.uploadFileJson)
router.get('/admin/api/trade-log', middleware.checkLogin, middleware.role, controllers.admin.api.tradeLogJson)
router.get('/admin/api/pageview', middleware.checkLogin, middleware.role, controllers.admin.api.pageviewJson)
router.get('/admin/api/pageview-clear', middleware.checkLogin, middleware.role, controllers.admin.api.pageviewClearJson)
router.post('/admin/api/startup', middleware.checkLogin, middleware.role, controllers.admin.api.post.updateStartupJson)
router.post('/admin/api/manual-add-score', middleware.checkLogin, middleware.role, controllers.admin.api.post.manualAddScoreJson)



// 数据库初始化
router.get('/admin/api/init', controllers.admin.api.init)



module.exports = { router }