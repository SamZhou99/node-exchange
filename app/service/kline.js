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

function round(num) {
    let len = 1000000
    return Math.round(num * len) / len
}

function random(min, max) {
    return min + Math.random() * (max - min)
}

async function makePlatformCurrency(symbol, period, size) {
    let a = []
    let dayTime = new Date('2021-12-13 00:00:00').getTime()
    for (let i = 0; i < size; i++) {
        let item = {
            "id": dayTime / 1000,
            "open": 0,
            "close": 0,
            "high": 0,
            "low": 0,
            "vol": 0,
            "amount": 0,
            "count": 0
        }
        a.push(item)
        dayTime = dayTime - 1000 * 60 * 60 * 24
    }

    let startPrice = 0.02
    let minR = 0.001
    let maxR = 0.009
    let bodong = 6.1
    let bd = 1.5
    let b = 1.25
    for (let i = a.length - 1; i >= 0; i--) {
        let item = a[i]
        let isUp = (random(1, 10) >= 4) ? true : false
        let open, close, high, low, vol
        if (isUp) {
            // 涨
            open = startPrice + random(minR, maxR + bd) * b
            close = open + random(minR, maxR + bd) * b
            high = open + random(minR, maxR + bodong)
            low = close - random(minR, maxR + bodong)
            startPrice = close
        } else {
            // 跌
            open = startPrice - random(minR, maxR + bd) * b
            close = open - random(minR, maxR + bd) * b
            high = open + random(minR, maxR + bodong)
            low = close - random(minR, maxR + bodong)
            startPrice = close
        }
        vol = random(minR, maxR * 1000)
        item.open = round(open)
        item.close = round(close)
        item.high = round(high)
        item.low = round(low)
        item.vol = round(vol)
    }

    return a
}

let KLineChart = {
    async get(symbol = 'btcusdt', period = '1day', size = '500') {
        const URL = `https://api.hadax.com/market/history/kline?period=${period}&size=${size}&symbol=${symbol}`
        const DATE = utils99.moment().utcOffset(480).format('YYYY-MM-DD')
        let filePath = __dirname + `/../../public/kline/${symbol}-${DATE}.json`
        // console.log('K线图文件路径：', filePath)

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
    },

    async platform_currency(symbol, period, size) {
        console.log('===========================================')
        console.log(symbol, period, size)
        console.log('===========================================')

        let filePath = __dirname + `/../../public/kline/${symbol}.json`
        // console.log('K线图文件路径：', filePath)

        // 静态文件存在
        let minR = 0.01
        let maxR = 5
        let currentDate = Math.floor(new Date().getTime() / 1000)
        if (fs.existsSync(filePath)) {
            let res = fs.readFileSync(filePath)
            let json = JSON.parse(res.toString())

            if (size == 'all') {
                return json
            }

            // 限制K线时间输出
            let a = []
            for (let i = 0; i < json.data.length; i++) {
                let item = json.data[i]
                let kts = item.id
                if (kts <= currentDate) {
                    a.push(item)
                }
            }
            json.currentDate = currentDate
            json.data = a
            return json
        }

        let data = await makePlatformCurrency(symbol, period, size)
        let result = {
            "ch": `market.${symbol}.kline.${period}`,
            "status": "ok",
            "ts": new Date().getTime(),
            "data": data
        }
        await saveFile(JSON.stringify(result), filePath)

        return result
    },

    async saveKlineData(symbol, data) {
        let filePath = __dirname + `/../../public/kline/${symbol}.json`
        // console.log('保存K线图文件路径：', filePath)
        return fs.writeFileSync(filePath, JSON.stringify(data))
    }
}


module.exports = KLineChart;