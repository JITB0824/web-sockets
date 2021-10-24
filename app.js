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
    connection.send(JSON.stringify({ "title": "Connected" }))

    //Respond to data request with latest chart data
    connection.on("message", message => {
        console.log(message.utf8Data)
        var jsonparse = JSON.parse(message.utf8Data)

        if (jsonparse.title == "update-data") {
            updateData()
        }
        if (jsonparse.title == "open-pin") {
            openPin(jsonparse.gpioPin)
        }
        if (jsonparse.title == "close-pin") {
            closePin(jsonparse.gpioPin)
        }
        if (jsonparse.title == "change-recording-status") {
            changeRecordingStatus(jsonparse.gpioPin)
        }
    })
})



//CHART MESSAGING FUNCTIONS

//Create open port array to track open pins and their recording status
var openPins = new Array()
var openPinData = new Array()


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
        openPinData: openPinData,
        data: "data here"
    }

    connection.send(JSON.stringify(chartData))
}

//Function to open a new GPIO pin
function openPin(gpioPin) {
    //Add the pin to the open pins
    var alreadyOpen = false
    for (var i = 0; i < openPinData.length; i++) {
        if (openPinData[i][0] == gpioPin) {
            alreadyOpen = true
        }
    }
    if (alreadyOpen) {
        console.log("Pin already open!")
    } else {
        openPinData.push([JSON.parse(gpioPin), false])
        console.log("Opening GPIO pin:" + gpioPin)
    }
    alreadyOpen = false
}

//Function to close a gpio pin
function closePin(gpioPin) {
    //Remove the port from open pins
    console.log(openPinData)
    console.log(gpioPin)
    console.log(openPinData.length)

    var wasntOpen = true

    for (var i = 0; i < openPinData.length; i++) {
        if (openPinData[i][0] == gpioPin) {
            openPinData.splice(i, 1)
            console.log("Closing GPIO pin:" + gpioPin)
            wasntOpen = false
        }
    }
    if (wasntOpen) {
        console.log("Pin already closed!")
    }
    wasntOpen = true
}

function changeRecordingStatus(gpioPin) {
    console.log("Changing recording status")
    for (var i = 0; i < openPinData.length; i++) {
        if (openPinData[i][0] == gpioPin) {
            if (openPinData[i][1] == false) {
                openPinData[i][1] = true
            } else {
                openPinData[i][1] = false
            }
        }
    }

}