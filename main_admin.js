const Koa = require('koa')
const path = require('path')
// const views = require('koa-views')
const static = require('koa-static')
const session = require('koa-session');
const koaBody = require('koa-body');
// 中间件 现在需要转换的一个操作
const convert = require('koa-convert');
const app = new Koa()

const configWeb = require('./config/web.js')
const { router } = require('./routes/admin.js')



app.use(session({
    key: 'koa:sess',
    // maxAge: 86400000,
    maxAge: 0,
    overwrite: true,
    httpOnly: true,
    signed: false, /** (boolean) signed or not (default true) */
    rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
    renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
}, app));

// form数据解析文件上传等 request.body request.files
app.use(koaBody({
    multipart: true,
    formLimit: "10mb",
    jsonLimit: "10mb",
    formidable: {
        // 上传目录
        uploadDir: path.join(__dirname, '/temp/csv'),
        // 文件大小
        maxFileSize: 200 * 1024 * 1024,
        // 保留扩展名
        keepExtensions: true
    }
}));


const cors = require('koa2-cors');
// 配置插件
app.use(cors({
    // 任何地址都可以访问
    // origin: "*",
    // 指定地址才可以访问
    origin: 'http://127.0.0.1:8080',
    // origin: function (ctx) {
    //     const whiteList = ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://temp02.go9488.cn']
    //     for (let i = 0; i < whiteList.length; i++) {
    //         let item = whiteList[i];
    //         const referer = ctx.header.referer
    //         if (referer && referer.indexOf(item) != -1) {
    //             return item
    //         }
    //     }
    //     return false;
    // },
    maxAge: 2592000,
    // 是否允许发送 cookie
    credentials: true,
    // exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    // allowMethods: ['GET', 'POST', 'DELETE'],
    // allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// // 自定义 404
// app.use(convert(function* (next) {
//     yield next
//     if (parseInt(this.status) === 404) {
//         // this.body = '404'
//         this.redirect(`/404.html`)
//     }
// }))

// 模板引擎 art-template
const render = require('koa-art-template');
render(app, { root: path.join(__dirname, './views'), extname: '.html' });

// 静态资源
app.use(static(path.join(__dirname, './public')))

// 路由配置
app.use(router.routes()).use(router.allowedMethods())

// 监听端口
app.listen(configWeb.admin.port)


console.log('==================================')
console.log(`koa start http://${configWeb.admin.host}:${configWeb.admin.port}`)
console.log('==================================')