const fs = require('fs')
const utils99 = require('node-utils99')
const { update } = require('node-utils99/mysql-sync-cache')
const dbConfig = require('../../config/db.js')
const webConfig = require('../../config/web.js')
const db = new utils99.mysqlSync(dbConfig.mysql)
const common = require('../../config/common.js')
const tools = require('../lib/tools.js')


// const URL = 'https://api.hadax.com/market/history/kline?period=1day&size=500&symbol=btcusdt'

async function saveFile(text, path) {
    return new Promise((res, rej) => {
        utils99.fsTools.text.Save(text, path, () => {
            res()
        })
    })
}

async function readFile(path) {
    return new Promise((res, rej) => {
        utils99.fsTools.text.Read(path, (data) => {
            res(data)
        })
    })
}

let KLineChart = {
    async get(symbol = 'btcusdt', period = '1day', size = '500') {
        const URL = `https://api.hadax.com/market/history/kline?period=${period}&size=${size}&symbol=${symbol}`
        const DATE = utils99.moment().utcOffset(480).format('YYYY-MM-DD')
        let filePath = __dirname + `/../../public/kline/${symbol}-${DATE}.json`
        console.log('K线图文件路径：', filePath)

        // 静态文件存在
        if (fs.existsSync(filePath)) {
            let res = fs.readFileSync(filePath)
            return JSON.parse(res.toString())
        }

        // 请求远程数据
        let httpRes = await utils99.request.axios
            .get({ url: URL, headers: utils99.request.HEADERS.mobile })
            .catch(err => {
                console.log('请求异常', URL, err)
            })

        // 请求完成并保存
        if (httpRes && httpRes.statusText == 'OK') {
            await saveFile(JSON.stringify(httpRes.data), filePath)
            return httpRes.data
        }

        return null
    }
}


module.exports = KLineChart;