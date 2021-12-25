const config = require('./config/web.js')
const service = require('./app/service/ws.js')
// const utils99 = require('node-utils99')
// const { update } = require('node-utils99/mysql-sync-cache')
// const WebSocketClient = require('websocket').client
const WebSocketServer = require('websocket').server

// 币安
const binance = require('./app/service/ws.binance.js')
binance.callback = async function (data) {
	await service.set(data.key, JSON.stringify(data.value))
}
binance.init()


// 火币
const huobi = require('./app/service/ws.huobi.js')
huobi.callback = async function (data) {
	await service.set(data.key, JSON.stringify(data.value))
}
huobi.init()


// coincap
const coincap = require('./app/service/ws.coincap.js')
coincap.callback = async function (data) {
	if (data.key == 'coincap-prices-assets') {
		let res = {
			platform: platform_currency_data != '' ? JSON.parse(platform_currency_data) : {},
			cache: JSON.parse(data.value)
		}
		broadcastPathSendText('/coin/price', JSON.stringify(res))
		return
	}
	await service.set(data.key, JSON.stringify(data.value))
}
coincap.init()


// tokenview
const tokenview = require('./app/service/ws.tokenview.js')
tokenview.callback = async function (data) {
	await service.set(data.key, JSON.stringify(data.value))
}
tokenview.init()


// 平台币
const platform_currency = require('./app/service/ws.platform_currency.js')
let platform_currency_data = ''
platform_currency.callback = async function (data) {
	platform_currency_data = JSON.stringify(data)
	console.log('平台币价格波动：', typeof platform_currency_data, platform_currency_data)
	broadcastPathSendText('/coin/price/platform', platform_currency_data)
}
platform_currency.init()

















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
		conn.sendUTF(text)
	}
}
// 按访问路径 广播
function broadcastPathSendText(path, text) {
	for (let key in connectionObj.data) {
		let conn = connectionObj.data[key]
		if (conn.path == path) {
			conn.sendUTF(text)
		}
	}
}




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
	conn.id = `uuid_${new Date().getTime()}_` + String(Math.random()).replace('.', '')
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
	})

	if (conn.path === '/coin/price') {
		let data = {
			platform: JSON.parse(platform_currency_data),
			cache: coincap.data.cache
		}
		conn.sendUTF(JSON.stringify(data))
	}

	if (conn.path === '/coin/price/platform') {
		conn.sendUTF(platform_currency_data)
	}

});

console.log('web socket port ', config.websocket.port)