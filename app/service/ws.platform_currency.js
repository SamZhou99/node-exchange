const utils99 = require('node-utils99')
const tools = require('../lib/tools.js')
const service = require('./index.js')


// let t = tools.round(1123123.23456789, 4, 4)


let _t = {
    tempInterval1: 0,
    intervalTime1: 1000 * 60,
    tempInterval2: 0,
    intervalTime2: 3000,
    callback: null,
    data: {
        currency: {
            symbol: ''
        },
        kline: [],
        target_price: 0,
        real_time_price: 0,
    },
    deffTime() {
        // 旧代码
        // let d
        // d = utils99.moment().format('YYYY-MM-DD 00:00:00')
        // let start_ts = new Date(d).getTime()
        // let new_ts = new Date().getTime()
        // d = utils99.moment(start_ts).add(1, 'd')
        // let end_ts = new Date(d).getTime()

        // 新代码
        let utfOffset = 800
        let start_ts = new Date(utils99.moment().utcOffset(utfOffset).format('YYYY-MM-DD 00:00:00')).getTime()
        let new_ts = new Date(utils99.moment().utcOffset(utfOffset).format('YYYY-MM-DD hh:mm:ss')).getTime()
        let end_ts = new Date(utils99.moment(start_ts).utcOffset(utfOffset).add(1, 'd')).getTime()


        let deff_ts = Math.round((end_ts - new_ts) / 1000)
        let day_ts = (end_ts - start_ts) / 1000
        let percent = 1 - deff_ts / day_ts

        // console.log('1111111111111', start_ts)
        // console.log('2222222222222', new_ts)
        // console.log('3333333333333', end_ts)
        // console.log('4444444444444', end_ts - start_ts, end_ts - new_ts)
        // console.log('5555555555555', percent)

        return { deff_ts, day_ts, percent }
    },
    async realTimePrice() {
        let symbol = _t.data.currency.symbol.toLowerCase() + 'usdt'
        let period = '1day'
        let size = 100
        _t.data.kline = await service.kline.platform_currency(symbol, period, size)
        let dayItem = _t.data.kline.data[0]
        _t.data.target_price = dayItem.close

        // 涨 1, 平 0, 跌 -1
        let is_up = dayItem.open < dayItem.close ? 1 : dayItem.open == dayItem.close ? 0 : -1
        let max = Math.max(dayItem.open, dayItem.close)
        let min = Math.min(dayItem.open, dayItem.close)
        let difference = max - min
        let percent = difference / dayItem.open * 100
        let target_price = Math.max(dayItem.open, dayItem.close)

        console.log(`K线 ${_t.data.kline.data.length} 天`)
        console.log(`开盘价：${dayItem.open} , 收盘价：${dayItem.close}`)
        console.log(`涨平跌：${is_up}`)
        console.log(`差价：${difference}`)
        console.log(`差价开盘价的百分比：${percent}%`)

        clearInterval(_t.tempInterval2)
        _t.tempInterval2 = setInterval(() => {

            let ts = _t.deffTime()
            let price_percent = percent
            let ts_percent = ts.percent
            let price
            if (is_up == 1) {
                price = difference * ts_percent + min
            } else if (is_up == -1) {
                price = max - difference * ts_percent
            }
            // let price = tools.random(min, max)
            // console.log('price', tools.round(price, 2, 8))
            if (_t.callback) {
                _t.callback({ price, price_percent, ts_percent, is_up })
            }

        }, _t.intervalTime2)
    },
    async start() {
        _t.data.currency = await service.currency.info()
        await _t.realTimePrice()
    },
    async init() {
        await _t.start()

        clearInterval(_t.tempInterval1)
        _t.tempInterval1 = setInterval(async () => {
            await _t.start()
        }, _t.intervalTime1)
    }
}


if (require.main === module) {
    _t.init()
}


module.exports = _t