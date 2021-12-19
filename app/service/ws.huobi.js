let huobi_api = {
	// 最近市场成交记录
	market_trade: {
		key: 'huobi-market-trade',
		url: 'https://api.huobi.pro/market/trade?symbol=btcusdt',
	},
	// 获得近期交易记录
	market_history_trade: {
		key: 'huobi-market-history-trade',
		url: 'https://api.huobi.pro/market/history/trade?symbol=btcusdt&size=2',
	},
	// 聚合行情
	market_detail_merged: {
		key: 'huobi-market-detail-merged',
		url: 'https://api.huobi.pro/market/detail/merged?symbol=btcusdt',
	},
	// K 线数据（蜡烛图）
	market_history_kline: {
		path: '/kline',
		key: 'huobi-market-history-kline',
		url: 'https://api.hadax.com/market/history/kline?period=1day&size=500&symbol=btcusdt',
	},
	// 所有交易对
	// {
	// 	"status":"ok",
	// 	"ts":1629789355531,
	// 	"data":[
	// 		{
	// 			"symbol":"smtusdt",
	// 			"open":0.004659,    // 开盘价
	// 			"high":0.004696,    // 最高价
	// 			"low":0.0046,       // 最低价
	// 			"close":0.00468,    // 收盘价
	// 			"amount":36551302.17544405,
	// 			"vol":170526.0643855023,
	// 			"count":1709,
	// 			"bid":0.004651,
	// 			"bidSize":54300.341,
	// 			"ask":0.004679,
	// 			"askSize":1923.4879
	// 		},
	// 		{
	// 			"symbol":"ltcht",
	// 			"open":12.795626,
	// 			"high":12.918053,
	// 			"low":12.568926,
	// 			"close":12.918053,
	// 			"amount":1131.801675005825,
	// 			"vol":14506.9381937385,
	// 			"count":923,
	// 			"bid":12.912687,
	// 			"bidSize":0.1068,
	// 			"ask":12.927032,
	// 			"askSize":5.3228
	// 		}
	// 	]
	// }
	market_tickers: {
		key: 'huobi-market-tickers',
		url: 'https://api.huobi.pro/market/tickers',
	}
}



_t = {
	name: "huobi API",
	async init() {
		console.log(`${_t.name} Init`)
	}
}



if (require.main === module) {
	_t.init()
}


module.exports = _t