const utils99 = require('node-utils99')
const url = 'https://usdt.tokenview.com/cn/address/TUbWM1G6QnjCBfif6hVmJJvKSooBKph5Dn'


async function init() {
    let res = await utils99.request.axios.get({ url })
    // let res = utils99.request.httpProgress(url, function (err, data) {
    //     console.log(err, data)
    // }, true)
    console.log(res)
}


init()