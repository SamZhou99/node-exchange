// const ws = require('nodejs-websocket')
const utils99 = require('node-utils99')
const config = require('./config/web.js')
const service = require('./app/service/ws.js')
// const { update } = require('node-utils99/mysql-sync-cache')
const WebSocketClient = require('websocket').client;




let huobi_api = {
	// 最近市场成交记录
	market_trade: {
		key: 'market-trade',
		url: 'https://api.huobi.pro/market/trade?symbol=btcusdt',
	},
	// 获得近期交易记录
	market_history_trade: {
		key: 'market-history-trade',
		url: 'https://api.huobi.pro/market/history/trade?symbol=btcusdt&size=2',
	},
	// 聚合行情
	market_detail_merged: {
		key: 'market-detail-merged',
		url: 'https://api.huobi.pro/market/detail/merged?symbol=btcusdt',
	},
	// K 线数据（蜡烛图）
	market_history_kline: {
		path: '/kline',
		key: 'market-history-kline',
		url: 'https://api.hadax.com/market/history/kline?period=1day&size=500&symbol=btcusdt',
	}
}

let coincap_api = {
	ws: {
		prices_assets: {
			key: 'coincap-prices-assets',
			url: 'wss://ws.coincap.io/prices?assets=bitcoin,ethereum,tether'
		}
	},
	assets: {
		path: '/coin-list',
		key: 'coincap-home-list',
		url: 'https://api.coincap.io/v2/assets/',
	},
}

// 行情列表实时更新
const coinCapWebSocketClient = new WebSocketClient();
coinCapWebSocketClient.on('connectFailed', function (error) {
	console.log('联机错误', error.toString());
});
coinCapWebSocketClient.on('connect', function (connection) {
	console.log('联机成功');

	connection.on('error', function (error) {
		console.log("数据错误", error.toString());
	});

	connection.on('close', function () {
		console.log('联机断开');
	});

	let btc = 0
	let eth = 0
	connection.on('message', function (msg) {
		console.log('消息数据', msg.utf8Data)
		// broadcastPathSendText(coincap_api.assets.path, msg.utf8Data)
		let data = JSON.parse(msg.utf8Data)
		btc = data.bitcoin || btc
		eth = data.ethereum || eth
		service.set(coincap_api.ws.prices_assets.key, JSON.stringify({ "bitcoin": btc, "ethereum": eth }))
	});
});
coinCapWebSocketClient.connect(coincap_api.ws.prices_assets.url, 'echo-protocol');
console.log('websocket客户端开始联机', coincap_api.ws.prices_assets.url)

// 首页行情列表
let temp01 = setInterval(async () => {
	// clearInterval(temp01)
	let httpRes = await utils99.request.axios.get({ url: coincap_api.assets.url })
	if (httpRes && httpRes.statusText == 'OK') {
		let setRes = await service.set(coincap_api.assets.key, JSON.stringify(httpRes.data))
		return setRes
	}
}, 1000 * 60)
// }, 1000)

// // K线图数据
// let temp02 = setInterval(async () => {
// 	clearInterval(temp02)
// 	console.log(huobi_api.market_history_kline.url)
// 	let httpRes = await utils99.request.axios.get({ url: huobi_api.market_history_kline.url, headers: utils99.request.HEADERS.mobile }).catch(err => {
// 		console.log('请求异常', err)
// 	})
// 	if (httpRes && httpRes.statusText == 'OK') {
// 		let setRes = await service.set(huobi_api.market_history_kline.key, JSON.stringify(httpRes.data))
// 		console.log(setRes)
// 		return setRes
// 	}
// 	// }, 1000 * 60 * 60 * 12) // 12H
// }, 1000)



let connectionObj = {
	data: {},
	add(conn) {
		connectionObj.data[conn.id] = conn
	},
	remove(id) {
		connectionObj.data[id] = null
		delete connectionObj.data[id]
	},
	find(id) {
		return connectionObj.data[id]
	},
}

// 广播
function broadcastSendText(text) {
	for (let key in connectionObj.data) {
		let conn = connectionObj.data[key]
		conn.send(text)
	}
}
function broadcastPathSendText(path, text) {
	for (let key in connectionObj.data) {
		let conn = connectionObj.data[key]
		console.log(conn.path)
		if (conn.path == path) {
			// conn.send(text)
			conn.sendUTF(text)
			// conn.sendBinary(text)
			// conn.sendBinary(Buffer.from(text))
		}

	}
}

// // 创建websocket服务
// const server = ws.createServer(async function (conn) {

// 	conn.on('close', (code, reason) => {
// 		console.log('断开')
// 		console.log(code, reason)
// 	})
// 	conn.on('error', (err) => {
// 		console.log('错误')
// 		console.log(err)
// 	})
// 	conn.on('text', (text) => {
// 		broadcastSendText(text)
// 	})



// 	// console.log('有新链接')
// 	// console.log(conn)


// 	if (conn.path === coincap_api.assets.path) {
// 		let res = await service.select(coincap_api.assets.key)
// 		conn.sendText(JSON.stringify(res[0]))
// 	}


// }).listen(config.websocket.port)




var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function (request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.end();
});
server.listen(config.websocket.port, function () {
	console.log((new Date()) + ' Server is listening on port ' + config.websocket.port);
});

let wsServer = new WebSocketServer({
	httpServer: server,
	// You should not use autoAcceptConnections for production
	// applications, as it defeats all standard cross-origin protection
	// facilities built into the protocol and the browser.  You should
	// *always* verify the connection's origin and decide whether or not
	// to accept it.
	autoAcceptConnections: false
});


wsServer.on('request', async function (request) {
	let conn = request.accept();
	// request.reject();
	conn.id = 'x_' + String(Math.random()).replace('.', '')
	conn.path = request.resourceURL.path
	console.log('联机成功', request.resourceURL.path, conn.id)
	connectionObj.add(conn)

	conn.on('message', function (message) {
		console.log(message)
		// 	if (message.type === 'utf8') {
		// 		console.log('Received Message: ' + message.utf8Data);
		// 		connection.sendUTF(message.utf8Data);
		// 	}
		// 	else if (message.type === 'binary') {
		// 		console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
		// 		connection.sendBytes(message.binaryData);
		// 	}
	})
	conn.on('close', function (reasonCode, description) {
		console.log('断开联机')
		connectionObj.remove(conn.id)
		// console.log(reasonCode, description)
	})

	if (conn.path === coincap_api.assets.path) {
		let res = await service.get(coincap_api.assets.key)
		conn.send(JSON.stringify(res))
	}

	if (conn.path === huobi_api.market_history_kline.path) {
		let res = await service.get(huobi_api.market_history_kline.key)
		conn.send(JSON.stringify(res))
	}

});

console.log('web socket port ', config.websocket.port)