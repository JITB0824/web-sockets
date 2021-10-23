// SERVER SETUP

//Create base HTTP server
const http = require('http')
const httpserver = http.createServer((req, res) => {
    console.log('We recieved a request for an html server?')
})

//Create websocket server
const WebSocketServer = require('websocket').server
const wss = new WebSocketServer({
    "httpServer": httpserver
})

//Set http server to listen to port 3000
httpserver.listen(3000, () => console.log('listening on port 3000'))

//Accept all connection requests
wss.on("request", request => {
    connection = request.accept()
    console.log("Connection request accepted")
})

//Create a connection ws to each client individually
wss.on("connection", function connection(ws) {
    console.log("connection created")
})

//CHART MESSAGING

//Create a test JSON array 
var chartData = {
    title: "Chart 1",
    message: "This is chart 1!"
}


//Set server to disperse chart data every 1000 ms. 
var chartUpdate = setInterval(updateCharts, 1000)

//Function to update chart data on all clients
function updateCharts() {
    console.log("Sending chart data update to all clients")
    wss.clients.forEach(function each(client) {
        ws.send(JSON.stringify(chartData))
    })
}