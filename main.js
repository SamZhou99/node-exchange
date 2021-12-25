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
const { router } = require('./routes/index.js')


const task = require('./app/service/task.js')
task.start()

app.use(session({
    key: 'koa:sess', /** (string) cookie key (default is koa:sess) */
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
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
    origin: 'http://localhost:8080',
    maxAge: 2592000,
    // 必要配置
    credentials: true
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
app.listen(configWeb.web.port)


console.log('==================================')
console.log(`koa start http://${configWeb.web.host}:${configWeb.web.port}`)
console.log('==================================')