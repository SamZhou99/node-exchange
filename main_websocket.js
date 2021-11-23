const ws = require('nodejs-websocket')
const config = require('./config/web.js')

const server = ws.createServer(function (conn) {
	conn.on('close', (code, reason) => {
		// console.log(code, reason)
	})
	conn.on('error', (err) => {
		console.log(err)
	})
	conn.on('text', (text) => {
		server.connections.forEach(function (connection) {
			connection.sendText(text)
		})
	})
}).listen(config.websocket.port)

console.log('web socket port ', config.websocket.port)