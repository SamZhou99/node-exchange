let utils99 = require('node-utils99')

function getPercent(start, end, now) {
    let deff_ts = Math.round((end - now) / 1000)
    let day_ts = (end - start) / 1000
    let percent = 1 - deff_ts / day_ts
    return Math.round(percent * 1000000) / 10000
}

function deffTime() {

    // 旧代码
    let start_ts = new Date(utils99.moment().format('YYYY/MM/DD 00:00:00')).getTime()
    let now_ts = new Date().getTime()
    let end_ts = new Date(utils99.moment(start_ts).add(1, 'd')).getTime()

    // 新代码
    let utfOffset = 0
    let start_ts_2 = new Date(utils99.moment().utcOffset(utfOffset).format('YYYY/MM/DD 00:00:00')).getTime()
    let now_ts_2 = new Date(utils99.moment().utcOffset(utfOffset).add(8, 'h').format('YYYY/MM/DD hh:mm:ss')).getTime()
    let end_ts_2 = new Date(utils99.moment(start_ts).utcOffset(utfOffset)).getTime()

    console.log('\n1 ', utils99.moment(start_ts).format('YYYY/MM/DD HH:mm:ss'), utils99.moment(start_ts_2).format('YYYY/MM/DD HH:mm:ss'))
    console.log('2 ', utils99.moment(now_ts).format('YYYY/MM/DD HH:mm:ss'), utils99.moment(now_ts_2).format('YYYY/MM/DD HH:mm:ss'))
    console.log('3 ', utils99.moment(end_ts).format('YYYY/MM/DD HH:mm:ss'), utils99.moment(end_ts_2).format('YYYY/MM/DD HH:mm:ss'))
    console.log('4 ', getPercent(start_ts, end_ts, now_ts), getPercent(start_ts_2, end_ts_2, now_ts_2))

    return getPercent(start_ts, end_ts, now_ts)
}


console.log(utils99.moment().format('YYYY-MM-DD 00:00:00'), utils99.moment().utcOffset(800).format('YYYY-MM-DD 00:00:00'))

setInterval(function () {
    deffTime()
}, 2000)