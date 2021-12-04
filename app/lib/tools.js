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
    }
};