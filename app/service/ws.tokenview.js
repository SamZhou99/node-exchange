const utils99 = require('node-utils99')
const common = require('../../config/common.js')
// const service = require('./ws.js')
// const WebSocketClient = require('websocket').client;


let tokenview_api = {
	// "_id": "bitcoin", // 币的全称小写字母
	// "changeUsd1h": "1.05", // 1小时涨跌幅
	// "changeUsd24h": "-11.09085", // 24小时涨跌幅
	// "changeUsd7d": "9.34", // 7天涨跌幅
	// "priceUsd": "6060.27", // 美元价格
	// "priceBtc": "6060.27", // 相对于多少个btc
	// "volumeUsd": "48385853374", // 交易额（美元）
	// "name": "Bitcoin", // 币的全称
	// "erc20Addr": "", // 如果是ETH的代币，这里会是代币地址
	// "marketCapUsd": "110781414314", // 市值（美元）
	// "symbol": "BTC",  // 币价单位符号
	// "rank": "1", // 市值排名
	// "uniqueId": "btc", // 简称小写
	// "circulatingSupply": "18279908.54", // 这个币的流通量
	// "totalUsd": "1.865007689300477E11", // 已弃用
	// "partialObject": false // 已弃用

	// "total": 10719,
	// "page": 0,
	// "size": 1000,
	// "marketCapData": [
	// 	{
	// 	  "rank": 0,
	// 	  "name": "Mix Marvel",
	// 	  "nickname": "Mix Marvel",
	// 	  "marketCapBtc": 0,
	// 	  "changeUsd1h": 0,
	// 	  "erc20Addr": "",
	// 	  "circulatingSupplyBtc": 0,
	// 	  "changeBtc7d": 0,
	// 	  "marketCapUsd": 0,
	// 	  "volumeUsd": 0,
	// 	  "changUsd24h": 0,
	// 	  "changeUsd24h": 0,
	// 	  "volumeBtc": 0,
	// 	  "uniqueId": "max",
	// 	  "changUsd7d": 0,
	// 	  "changeBtc24h": 0,
	// 	  "priceBtc": 0,
	// 	  "changeBtc1h": 0,
	// 	  "priceUsd": 0,
	// 	  "symbol": "MAX"
	// 	},
	// ]
	key: 'tokenview-market-cap',
	// 免费API 一分一次
	url: 'http://www.tokenview.com:8088/market/marketCap?page=0&size=100'
}


let _t = {
	name: 'tokenview API',
	tempInterval: 0,
	callback: null,
	async getData() {
		let res = await utils99.request.axios.get({ url: tokenview_api.url }).catch(err => {
			console.log('请求异常：', tokenview_api.url)
		})
		if (!res) {
			return null
		}
		if (res.statusText != 'OK') {
			console.log(res.statusText)
			return null
		}
		const result = _t.getFilterData(res.data.marketCapData)
		// console.log(_t.name, result)
		return result
	},

	getFilterData(data) {
		let need = common.coin.need
		let temp = []
		for (let i = 0; i < data.length; i++) {
			let d = data[i]
			for (let j = 0; j < need.length; j++) {
				let item = need[j]
				if (d.uniqueId.toLocaleLowerCase() == item) {
					temp.push(d)
				}
			}
		}
		return temp
	},

	async start() {
		clearInterval(_t.tempInterval)
		_t.tempInterval = setInterval(async () => {
			let res = await _t.getData()
			if (res && _t.callback) {
				_t.callback({ key: tokenview_api.key, value: res })
			}
		}, 1000 * 60 * 1.5) // 一分半执行一次
	},
	async init() {
		console.log(_t.name)
		_t.start()
	}
}


if (require.main === module) {
	_t.init()
}


module.exports = _t