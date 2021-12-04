const ws = require('nodejs-websocket')
const config = require('./config/web.js')

const server = ws.createServer(function (conn) {
	console.log('有新链接')
	console.log(conn)
	conn.on('close', (code, reason) => {
		console.log('断开')
		// console.log(code, reason)
	})
	conn.on('error', (err) => {
		console.log('错误')
		console.log(err)
	})
	conn.on('text', (text) => {
		server.connections.forEach(function (connection) {
			connection.sendText(text)
		})
	})
}).listen(config.websocket.port)

console.log('web socket port ', config.websocket.port)