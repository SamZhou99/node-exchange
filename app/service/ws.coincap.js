const utils99 = require('node-utils99')
const common = require('../../config/common.js')
const service = require('./ws.js')
const WebSocketClient = require('websocket').client;



let _t = {
    name: 'CoinCap API',
    client: null,
    tempTimeout: 0,
    tempInterval: 0,
    intervalTime: 1000 * 60 * 60 * 24 / 200, // 一天200次免费请求
    callback: null,
    data: {
        btc: 0,
        eth: 0,
    },
    coincap_api: {
        ws: {
            prices_assets: {
                key: 'coincap-prices-assets',
                url: 'wss://ws.coincap.io/prices?assets=bitcoin,ethereum,tether'
            }
        },
        http: {
            assets: {
                path: '/coin-list',
                key: 'coincap-coin-list',
                url: 'https://api.coincap.io/v2/assets/',
            },
        },

    },
    subscribe: {
        miniTicker: {
            "method": "SUBSCRIBE",
            "params": ["!miniTicker@arr@3000ms"],
            "id": 1
        }
    },
    onFailed(error) {
        console.log(_t.name + '联机错误', error.toString());
        _t.reConnection()
    },
    onError(error) {
        console.log(_t.name + "数据错误", error.toString());
        _t.reConnection()
    },
    onClose() {
        console.log(_t.name + '联机断开');
        _t.reConnection()
    },
    onMessage(msg) {
        console.log(_t.name + '消息数据', msg.utf8Data.length)
        console.log(_t.name + '消息数据', typeof msg.utf8Data, msg.utf8Data)
        let data = JSON.parse(msg.utf8Data)
        _t.data.btc = data.bitcoin || _t.data.btc
        _t.data.eth = data.ethereum || _t.data.eth
        // service.set(_t.coincap_api.ws.prices_assets.key, JSON.stringify({ "bitcoin": _t.data.btc, "ethereum": _t.data.eth }))
        if (_t.callback) {
            _t.callback({ key: _t.coincap_api.ws.prices_assets.key, value: { "bitcoin": _t.data.btc, "ethereum": _t.data.eth } })
        }
    },
    onConnection(connection) {
        console.log(_t.name + '联机成功')
        connection.on('error', _t.onError);
        connection.on('close', _t.onClose);
        connection.on('message', _t.onMessage);
        connection.sendUTF(JSON.stringify(_t.subscribe.miniTicker))
    },
    reConnection() {
        console.log(_t.name + '重新联机');
        clearTimeout(this.tempTimeout)
        _t.tempTimeout = setTimeout(() => {
            _t.init()
        }, 1000 * 60) // 一分钟后重联
    },
    initHttpGetData() {
        // 行情列表
        console.log(_t.name + '行情列表多少秒一次？', _t.intervalTime)
        clearInterval(_t.tempInterval)
        _t.tempInterval = setInterval(async () => {
            let axios_result = await utils99.request.axios.get({ url: _t.coincap_api.http.assets.url })
            if (axios_result && axios_result.statusText == 'OK') {
                console.log(_t.name, axios_result.data.length)
                if (_t.callback) {
                    _t.callback({ key: _t.coincap_api.http.assets.key, value: axios_result.data })
                }
            }
        }, _t.intervalTime)
    },
    init() {
        _t.client = new WebSocketClient()
        _t.client.on('connectFailed', _t.onFailed)
        _t.client.on('connect', _t.onConnection)
        // __t.client.connect(__t.coincap_api.ws.prices_assets.url, 'echo-protocol')
        console.log(`${_t.name} WS Init`, _t.coincap_api.ws.prices_assets.url)

        _t.initHttpGetData()
    }
}

if (require.main === module) {
    _t.init()
}

module.exports = _t