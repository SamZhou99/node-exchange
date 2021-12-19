// const utils99 = require('node-utils99')
const common = require('../../config/common.js')
// const service = require('./ws.js')
const WebSocketClient = require('websocket').client;


let _t = {
    name: 'Binance API',
    url: 'wss://stream.binance.com:9443/ws',
    // url: 'wss://fstream.binance.com/ws',
    client: null,
    tempTimeout: 0,
    callback: null,
    subscribe: {
        miniTicker: {
            "method": "SUBSCRIBE",
            "params": ["!miniTicker@arr@3000ms"],
            "id": 1
        }
    },
    onFailed(error) {
        console.log(_t.name, '联机错误', error.toString());
        _t.reConnection()
    },
    onError(error) {
        console.log(_t.name, "数据错误", error.toString());
        _t.reConnection()
    },
    onClose() {
        console.log(_t.name, '联机断开');
        _t.reConnection()
    },
    onMessage(msg) {
        console.log(_t.name, '消息数据', msg.utf8Data.length)
        let need = common.coin.need
        let data = JSON.parse(msg.utf8Data)
        let temp = []
        for (let i = 0; i < data.length; i++) {
            let d = data[i]
            for (let j = 0; j < need.length; j++) {
                let item = need[j]
                if (d.s.toLocaleLowerCase() == item + 'usdt') {
                    temp.push(d)
                }
            }
        }

        // console.log(_t.name, '有用的数据')
        // console.log(_t.name, temp)

        if (_t.callback) {
            _t.callback({ key: 'binance-mini-ticker', value: temp })
        }

    },
    onConnection(connection) {
        console.log(_t.name, '联机成功')
        connection.on('error', _t.onError);
        connection.on('close', _t.onClose);
        connection.on('message', _t.onMessage);
        connection.sendUTF(JSON.stringify(_t.subscribe.miniTicker))
    },
    reConnection() {
        console.log(_t.name, '重新联机');
        clearTimeout(this.tempTimeout)
        _t.tempTimeout = setTimeout(() => {
            _t.init()
        }, 1000 * 60) // 一分后重联
    },
    init() {
        _t.client = new WebSocketClient()
        _t.client.on('connectFailed', _t.onFailed)
        _t.client.on('connect', _t.onConnection)
        _t.client.connect(_t.url);
        console.log(`${_t.name} WS Init`, _t.url)
    }
}

if (require.main === module) {
    _t.init()
}

module.exports = _t