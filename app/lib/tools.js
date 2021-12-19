const common = require('../../config/common.js')

module.exports = {

    isNumber(anything) {
        let n = parseInt(anything)
        return !isNaN(n)
    },

    getWalletType(wallet_address) {
        if (wallet_address.substr(0, 2) == "0x") {
            return common.coin.type.ETH
        }
        if (wallet_address.substr(0, 1) == "T") {
            return common.coin.type.USDT
        }
        if (wallet_address.substr(0, 1) == "1") {
            return common.coin.type.BTC
        }
        return null
    },

    random(min, max) {
        return min + Math.random() * (max - min)
    },

    round(num, intLen = 2, dotLaterLen = 6) {
        let z = '000000000000000000000000000000'
        let zn = Number(1 + z.substr(0, dotLaterLen))
        num = Math.round(num * zn) / zn
        let s = String(num)

        if (s.indexOf('.') !== -1) {
            let a = s.split('.')
            let n1 = a[0], n2 = a[1], zn

            if (a[0].length < intLen) {
                n1 = z.substr(0, intLen - a[0].length) + a[0]
            }

            if (a[1].length < dotLaterLen) {
                zn = z.substr(0, dotLaterLen - a[1].length)
                n2 = String(a[1]) + zn
            }

            let res = `${n1}.${n2}`
            return res
        }

        let zl = z.substr(0, dotLaterLen)
        return `${s}.${zl}`
    }

};