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
        cache: {}
    },
    coincap_api: {
        ws: {
            prices_assets: {
                key: 'coincap-prices-assets',
                // url: 'wss://ws.coincap.io/prices?assets=bitcoin,ethereum,xrp,eos,ethereum-classic,binance'
                url: 'wss://ws.coincap.io/prices?assets=ALL'
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
        console.log(_t.name + '消息数据', msg.utf8Data.length, typeof msg.utf8Data)
        _t.addCache(msg.utf8Data)
        if (_t.callback) {
            _t.callback({ key: _t.coincap_api.ws.prices_assets.key, value: msg.utf8Data })
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

    addCache(msg) {
        let json = JSON.parse(msg)
        for (let key in json) {
            _t.data.cache[key] = json[key]
        }
    },

    getFilterData(data) {
        // "data": [
        //     {
        //       "id": "bitcoin",
        //       "rank": "1",
        //       "symbol": "BTC",
        //       "name": "Bitcoin",
        //       "supply": "18908731.0000000000000000",
        //       "maxSupply": "21000000.0000000000000000",
        //       "marketCapUsd": "922325126296.9449560958840235",
        //       "volumeUsd24Hr": "14086730994.4259487632088966",
        //       "priceUsd": "48777.7379823608975185",
        //       "changePercent24Hr": "0.7388389360587474",
        //       "vwap24Hr": "48723.9656716751833886",
        //       "explorer": "https://blockchain.info/"
        //     },

        let need = common.coin.need
        let temp = []
        for (let i = 0; i < data.length; i++) {
            let d = data[i]
            for (let j = 0; j < need.length; j++) {
                let item = need[j]
                if (d.symbol.toLocaleLowerCase() == item) {
                    temp.push(d)
                }
            }
        }
        return temp
    },

    async getData() {
        let axios_result = await utils99.request.axios.get({ url: _t.coincap_api.http.assets.url })
        if (axios_result && axios_result.statusText == 'OK') {
            return _t.getFilterData(axios_result.data.data)
        }
        return null
    },

    async initHttpData() {
        // 行情列表
        console.log(_t.name + '行情列表多少秒一次？', _t.intervalTime)
        clearInterval(_t.tempInterval)
        _t.tempInterval = setInterval(async () => {
            const value = await _t.getData()
            if (_t.callback) {
                _t.callback({ key: _t.coincap_api.http.assets.key, value: value })
            }
        }, _t.intervalTime)
    },
    async init() {
        _t.client = new WebSocketClient()
        _t.client.on('connectFailed', _t.onFailed)
        _t.client.on('connect', _t.onConnection)
        _t.client.connect(_t.coincap_api.ws.prices_assets.url, 'echo-protocol')
        console.log(`${_t.name} WS Init`, _t.coincap_api.ws.prices_assets.url)

        await _t.initHttpData()

        // console.log(_t.name, await _t.getData())
    }
}

if (require.main === module) {
    _t.init()
}

module.exports = _t