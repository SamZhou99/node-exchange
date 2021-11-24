const utils99 = require('node-utils99')
const lang = require('../../config/language.js')
const service = require('../service/index.js')

/**
 * 共享 网站语言数据
 * @param {*} ctx 
 * @returns 
 */
function shareLanguageData(ctx) {
    let defLang = lang.default
    if (ctx.cookies.get('lang')) {
        defLang = ctx.cookies.get('lang')
    }
    ctx.data = {}
    ctx.data.lang = lang
    ctx.data.defLang = defLang
    return true
}

/**
 * 共享 会话数据
 * @param {*} ctx 
 * @returns 
 */
function shareSessionData(ctx) {
    ctx.data.session = ctx.session
    return ctx.data.session
}

/**
 * 检查 会话是否登录
 * @param {*} ctx 
 * @returns 
 */
function checkSessionLogin(ctx) {
    ctx.data.isLogin = !!ctx.session['isLogin']
    return ctx.data.isLogin
}

/**
 * 页面浏览记录
 * @param {*} ctx 
 * @returns 
 */
async function pageViewLog(ctx) {
    let user_id = checkSessionLogin(ctx) ? ctx.session.user.id : 0
    let ip = utils99.getIP(ctx.req).replace('::ffff:', '')
    let referer = ctx.request.header['referer']
    let url = ctx.request.url
    let userAgent = ctx.request.header['user-agent']
    await service.pageview.addLog(user_id, ip, referer, url, userAgent)
    ctx.data.currUrl = url
    return true
}


let middleware = {
    async commmonData(ctx, next) {
        // cookie里有设置过，就用cookie里的。没有就使用默认配置
        shareLanguageData(ctx)
        checkSessionLogin(ctx)
        await pageViewLog(ctx)
        await next()
    },
    async checkLogin(ctx, next) {
        shareLanguageData(ctx)
        let isLogin = checkSessionLogin(ctx)
        if (!isLogin) {
            ctx.redirect(`/login`)
            return
        }
        shareSessionData(ctx)
        await pageViewLog(ctx)
        await next()
    },
    async role(ctx, next) {
        // console.log(ctx.session.user.type)
        if (ctx.session.user.type > 4) {
            ctx.status = 404
            ctx.body = 'Not Found'
            return
        }
        await next()
    },
    async checkApi(ctx, next) {
        console.log('checkApi', ctx.request.method, ctx.request.url)
        if (!checkIsLogin(ctx)) {
            ctx.body = { message: '非法请求!' }
            return
        }
        let currPage = ctx.request.url
        ctx.data = { currPage }
        await pageViewLog(ctx)
        await next()
    },

}

module.exports = middleware