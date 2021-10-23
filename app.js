const http = require('http')
const httpserver = http.createServer((req, res) => {
    console.log('We recieved a request for an html server?')
})

const WebSocketServer = require('websocket').server
const wss = new WebSocketServer({
    "httpserver": httpserver
})

wss.on("request", request => {
    connection = request.accept()
    console.log("Connection request accepted")
})

wss.on("connection", function connection(ws) {
    console.log("connection created")
})



httpserver.listen(3000, () => console.log('listening on port 3000'))