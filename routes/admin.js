const router = new require('koa-router')()
const middleware = require('../app/middleware/index.js')
const { page: controllers } = require('../app/controllers/index.js')


router.post('/login', middleware.commmonData, controllers.login.post)
router.get('/logout', middleware.commmonData, controllers.logout.page)

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



// 管理首页
router.get('/admin', controllers.admin.index.page)
router.post('/admin', controllers.admin.index.post)
// 仪表面板页面
router.get('/admin/dashboard', middleware.checkLogin, middleware.role, controllers.admin.dashboard)
// 用户列表页面
router.get('/admin/user-list', middleware.checkLogin, middleware.role, controllers.admin.userList)
router.get('/admin/user-add', middleware.checkLogin, middleware.role, controllers.admin.userAdd)
router.get('/admin/user-auth/:user_id', middleware.checkLogin, middleware.role, controllers.admin.userAuth)
// 系统钱包页面
router.get('/admin/system-wallet', middleware.checkLogin, middleware.role, controllers.admin.systemWallet)
router.get('/admin/upload-wallet-address', middleware.checkLogin, middleware.role, controllers.admin.uploadWalletAddress)
router.get('/admin/trade-log', middleware.checkLogin, middleware.role, controllers.admin.tradeLog)
// 浏览记录页面
router.get('/admin/pageview', middleware.checkLogin, middleware.role, controllers.admin.pageview)
// 行情
// 添加货币页面
router.get('/admin/market-coin', middleware.checkLogin, middleware.role, controllers.admin.marketCoin)
// 控制涨跌页面
router.get('/admin/market-change', middleware.checkLogin, middleware.role, controllers.admin.marketChange)
// 人工上分页面
router.get('/admin/manual-add-score', middleware.checkLogin, middleware.role, controllers.admin.manualAddScore)
// 提币列表
router.get('/admin/withdraw', middleware.checkLogin, middleware.role, controllers.admin.withdraw)
// 修改个人密码
router.get('/admin/change-password', middleware.checkLogin, middleware.role, controllers.admin.changePassword.page)
router.post('/admin/change-password', middleware.checkLogin, middleware.role, controllers.admin.changePassword.post)


// /admin/coin-add
// /admin/coin-edit
// admin api
// 管理首页图表
router.get('/admin/api/dashboard', middleware.checkLogin, middleware.role, controllers.admin.api.dashboardJson)
// 用户列表详细信息
router.get('/admin/api/user-list', middleware.checkLogin, middleware.role, controllers.admin.api.userListJson)
// 人工添加用户
router.post('/admin/api/user-add', middleware.checkLogin, middleware.role, controllers.admin.api.post.userAddJson)
// 用户分类
router.get('/admin/api/user-group-category', middleware.checkLogin, middleware.role, controllers.admin.api.userGroupCategoryJson)
// 更新用户状态
router.get('/admin/api/user/update-one-field', middleware.checkLogin, middleware.role, controllers.admin.api.userUpdateOneFieldJson)
// 钱包列表
router.get('/admin/api/wallet-list', middleware.checkLogin, middleware.role, controllers.admin.api.walletListJson)
// 上传钱包
router.post('/admin/api/upload-file', middleware.checkLogin, middleware.role, controllers.admin.api.uploadFileJson)
router.post('/admin/api/upload-wallet', middleware.checkLogin, middleware.role, controllers.admin.api.uploadWalletJson)
// 交易日志
router.get('/admin/api/trade-log', middleware.checkLogin, middleware.role, controllers.admin.api.tradeLogJson)
// 浏览日志
router.get('/admin/api/pageview', middleware.checkLogin, middleware.role, controllers.admin.api.pageviewJson)
// 清除浏览日志
router.get('/admin/api/pageview-clear', middleware.checkLogin, middleware.role, controllers.admin.api.pageviewClearJson)
// 修改平台币信息
router.post('/admin/api/startup', middleware.checkLogin, middleware.role, controllers.admin.api.post.updateStartupJson)
// 手动上分
router.post('/admin/api/manual-add-score', middleware.checkLogin, middleware.role, controllers.admin.api.post.manualAddScoreJson)
// 保存K线图数据
router.post('/admin/api/kline', middleware.checkLogin, middleware.role, controllers.admin.api.post.saveKLineDataJson)
// 更新认证信息
router.post('/admin/api/update-authentication', middleware.checkLogin, middleware.role, controllers.admin.api.post.updateAuthentication)
// 提币审核更新
router.post('/admin/api/withdraw-update', middleware.checkLogin, middleware.role, controllers.api.withdraw.updateJson)
// 提币列表
router.get('/admin/api/withdraw-log', middleware.checkLogin, controllers.api.withdraw.allLogJson)
// 数据库初始化
router.get('/admin/api/init', controllers.admin.api.init)



module.exports = { router }