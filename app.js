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

    //Respond to data request with latest chart data
    connection.on("message", message => {
        console.log(message.utf8Data)
        var jsonparse = JSON.parse(message.utf8Data)

        if (jsonparse.title == "chart-update") {
            connection.send(JSON.stringify(chartData))
        }
    })
})



//CHART MESSAGING

//Create a test JSON array 
var chartData = {
    title: "chart-data",
    message: "This is the server"
}

//Function to update chart data on all clients
function updateCharts() {
    console.log("Sending chart data update to all clients")
    ws.send(JSON.stringify(chartData))
}

