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

//Create connection array to store all connections
var connection = new Array()

//Accept all connection requests
wss.on("request", request => {
    connection = request.accept()
    console.log("Connection request accepted")

    //Respond to data request with latest chart data
    connection.on("message", message => {
        console.log(message.utf8Data)
        var jsonparse = JSON.parse(message.utf8Data)

        if (jsonparse.title == "update-data") {
            updateData()
        }
        if (jsonparse.title == "open-port") {
            openPort(jsonparse.gpioPort)
        }
        if (jsonparse.title == "close-port") {
            closePort(jsonparse.gpioPort)
        }
    })
})



//CHART MESSAGING FUNCTIONS

//Create open port array to track open ports and their recording status
var openPorts = new Array()
var openPortData = new Array()


//Create a test JSON array 
var chartData = {
    title: "chart-data",
    message: "This is the server"
}

//Function to update chart data on all clients
function updateData() {
    console.log("Sending chart data update to all clients")

    chartData = {
        title: "chart-data",
        openPortData: openPortData,
        data: "data here"
    }

    connection.send(JSON.stringify(chartData))
}

//Function to open a new GPIO port
function openPort(gpioPort) {
    //Add the port to the open ports
    if (openPortData.includes(gpioPort) == false) {
        console.log(gpioPort)
        openPortData.push([JSON.parse(gpioPort), false])

        console.log("Opening GPIO port:" + gpioPort)
        console.log(openPortData)
    } else {
        console.log("Port already open!")
    }
}

//Function to close a gpio port
function closePort(gpioPort) {
    //Remove the port from open ports
    console.log(openPortData)
    console.log(gpioPort)
    if (openPortData.includes(gpioPort) == true) {
        openPortData.splice(openPortData.indexOf(gpioPort), 2)
        console.log("Closing GPIO port:" + gpioPort)
    } else {
        console.log("Port already closed!")
    }
}