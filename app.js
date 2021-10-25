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
    var client = request.accept()
    connection.push(client)
    console.log("Connection request accepted")
    connection[connection.indexOf(client)].send(JSON.stringify({ "title": "Connected" }))
    console.log("adding new client, now have this many clients: " + connection.length)

    //Respond to data request with latest chart data
    connection[connection.indexOf(client)].on("message", message => {
        var jsonparse = JSON.parse(message.utf8Data)

        //Uncomment log if needed for degubbing
        //console.log(message.utf8Data)

        if (jsonparse.title == "update-data") {
            updateData(connection[connection.indexOf(client)])
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
        if (jsonparse.title == "close-all") {
            closeAllPins()
        }
        if (jsonparse.title == "open-connected-pins") {
            openConnectedPins()
        }
    })
    connection[connection.indexOf(client)].on("close", function () {
        connection.splice(connection.indexOf(client), 1)
        console.log("removing lost client, now have this many clients: " + connection.length)
    })
})



//CHART MESSAGING FUNCTIONS

//Create open port array to track open pins and their recording status
var openPins = new Array()
var openPinData = new Array()

//Create variable to track how many recordings are created for each pin
var recordingCounter = new Array()

//Initialize first recording loop boolean to know when you should start a new recording file
var firstRecordingLoop = new Array()

//Create fs array to keep track of open write streams
var fsWriteStreams = new Array()


//Create a test JSON array 
var chartData = {
    title: "chart-data",
    message: "This is the server"
}

//Function to update chart data on all clients
function updateData(connection) {

    chartData = {
        title: "chart-data",
        openPinData: openPinData,
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
        var data = new Array()
        openPinData.push([JSON.parse(gpioPin), false, data])
        console.log("Opening GPIO pin:" + gpioPin)
        console.log(openPinData)

        //Keep recording counter array following with indices of openPinData
        recordingCounter.push([[], []])
        fsWriteStreams.push([[], []])
    }
    alreadyOpen = false

}

//Function to close a gpio pin
function closePin(gpioPin) {
    //Remove the port from open pins

    var wasntOpen = true

    for (var i = 0; i < openPinData.length; i++) {
        if (openPinData[i][0] == gpioPin) {
            openPinData.splice(i, 1)
            console.log("Closing GPIO pin:" + gpioPin)
            wasntOpen = false
            recordingCounter.splice(i, 1)
            fsWriteStreams.splice(i, 1)
        }
    }
    if (wasntOpen) {
        console.log("Pin already closed!")
    }
    wasntOpen = true
}

//Function to close all open pins
function closeAllPins() {
    openPinData = new Array()
    console.log("Clearing all open pins")
}

function changeRecordingStatus(gpioPin) {
    console.log("Changing recording status")
    for (var i = 0; i < openPinData.length; i++) {
        if (openPinData[i][0] == gpioPin) {
            if (openPinData[i][1] == false) {
                openPinData[i][1] = true
                firstRecordingLoop[i] = true


            } else {
                openPinData[i][1] = false
            }
        }
    }
}

function openConnectedPins() {
    console.log("Opening connected pins")
    //Write script that checks every gpio pin for valid data, and if found, runs add pin for that pin to make sure it is open
}

var start = Date.now()

setInterval(getSensorData, 10)
function getSensorData() {
    for (var i = 0; i < openPinData.length; i++) {
        //Set a consistent random variable
        var deltaTime = Date.now() - start
        var randomVariable = Math.random() * 10
        var pinTimeData = [deltaTime, randomVariable]
        start = Date.now()

        //Here we push a random variable, in future will use gpio pin data here. 
        openPinData[i][2].push(randomVariable)

        //Here we need to take the sensor data point and throw it into passive recording

        //Here we check if recording, if we are we throw data point into recording file. 
        if (openPinData[i][1] == true) {
            if (firstRecordingLoop[i]) {
                console.log(openPinData[i][0])
                console.log(recordingCounter)
                if (recordingCounter[i][0] == []) {
                    console.log("Creating recording Counter push!")
                    recordingCounter[i][0] = [openPinData[i][0], 1]
                    console.log(recordingCounter)
                    console.log(recordingCounter.indexOf(openPinData[i][0]))
                } else {
                    recordingCounter[i][1]++
                }
                //Here is the code that initializes the write streams
                console.log(openPinData[i][0])
                console.log("this still is " + recordingCounter[i][1])
                var writeStreamName = "PIN" + JSON.stringify(openPinData[i][0]) + ", RECORDING" + recordingCounter[i][1]
                var fs = require('fs')
                var writeStream = fs.createWriteStream(writeStreamName, {
                    flags: 'a'
                })
                fsWriteStreams[i] = [writeStreamName, writeStream]
                console.log(fsWriteStreams)
                writeStream.write(JSON.stringify(pinTimeData) + "\n")

                firstRecordingLoop[i] = false
                console.log(writeStreamName)
                console.log(fsWriteStreams)
            } else {
                var writeStream = fsWriteStreams[i][1]
                writeStream.write(JSON.stringify(pinTimeData) + "\n")
            }

        }

    }

}

//RECORDINGS
//
//

//Initialize arrays to store the locations of each data stream created. 
var recordings = new Array()
var passiveRecordings = new Array()
