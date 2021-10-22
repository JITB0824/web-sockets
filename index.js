const express = require('express')
const { getSystemErrorMap } = require('util')
const app = express()
const server = require('http').createServer(app)
const WebSocket = require('ws')
const d = new Date()

const wss = new WebSocket.Server({ server: server })
var x = new Array(300)
var y = new Array(300)
for (var i = 0; i = 300; i++) {
    x[i] = i
}
for (var i = 0; i < 300; i++) {
    y[i] = Math.random()
}
counter = 0
graph_size = 100

samples = 0
tic = d.getTime()


function get_graph_data() {
    graph_to_send = JSON.stringify([x], [y])
    console.log(JSON.stringify([x], [y]))
    return graph_to_send
}

wss.on('connection', function connection(ws) {
    console.log('New client connected')
    ws.send('welcome new client!')

    ws.on('message', function incoming(message) {
        console.log('recieved: %s', message)
        console.log(get_graph_data())
        client.send(get_graph_data())
    })
})

app.get('/', (req, res) => res.send('Hello World!'))

server.listen(3000, () => console.log('Listening on port 3000'))