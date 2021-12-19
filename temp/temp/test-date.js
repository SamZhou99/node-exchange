const utils99 = require('node-utils99')

let dayTime = new Date('2021-12-13 00:00:00').getTime()
for (let i = 0; i < 10; i++) {
    dayTime = dayTime - 1000 * 60 * 60 * 24
    let d = utils99.moment(dayTime).format('YYYY-MM-DD')
    console.log(dayTime, d)
}
