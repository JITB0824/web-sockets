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
        if (jsonparse.title == "download-passive") {
            downloadPassive(connection[connection.indexOf(client)], jsonparse.gpioPin)
        }
        if (jsonparse.title == "download-recordings") {
            downloadRecordings(connection[connection.indexOf(client)], jsonparse.gpioPin)
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
        var timestamps = new Array()
        openPinData.push([JSON.parse(gpioPin), false, data, timestamps])
        console.log("Opening GPIO pin:" + gpioPin)

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
                var filepath = __dirname + "\\PIN" + JSON.stringify(openPinData[i][0]) + "RECORDING" + recordingCounter[i][1] + ".txt"
                var fs = require('fs')
                var data = fs.readFileSync(filepath, 'utf8')
                data = data.replaceAt(data.length - 1, "]")
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
        openPinData[i][3].push(deltaTime)

        //Here we need to take the sensor data point and throw it into passive recording

        //Here we check if recording, if we are we throw data point into recording file. 
        if (openPinData[i][1] == true) {
            if (firstRecordingLoop[i]) {
                if (recordingCounter[i][0] == []) {
                    console.log("Creating recording Counter push!")
                    recordingCounter[i][0] = [openPinData[i][0], 1]
                } else {
                    recordingCounter[i][1]++
                }
                //Here is the code that initializes the write streams
                var writeStreamName = "PIN" + JSON.stringify(openPinData[i][0]) + "RECORDING" + recordingCounter[i][1] + ".txt"
                var fs = require('fs')
                var writeStream = fs.createWriteStream(writeStreamName, {
                    flags: 'a'
                })
                fsWriteStreams[i] = [writeStreamName, writeStream]

                writeStream.write("[" + JSON.stringify(pinTimeData) + ",")

                firstRecordingLoop[i] = false
            } else {
                var writeStream = fsWriteStreams[i][1]
                writeStream.write(JSON.stringify(pinTimeData) + ",")
            }

        }

    }

}



//RECORDINGS
//
//

function downloadPassive(client, pin) {
    console.log("Sending out passive data")
    var openPins = new Array()
    for (var i = 0; i < openPinData.length; i++) {
        openPins.push(openPinData[i][0])
    }
    var pinIndex = openPins.indexOf(pin)
    var dataset = new Array()
    var datapoint = new Array(new Array())
    var timerArray = openPinData[pinIndex][3]
    var dataArray = openPinData[pinIndex][2]


    var dataset = [timerArray, dataArray]

    var filename = "Passive Pin " + pin + " Data"
    download(client, filename, dataset)
}




function downloadRecordings(client, pin) {
    console.log("Sending out recordings")
    var fs = require('fs')
    openPins = new Array()
    for (var i = 0; i < openPinData.length; i++) {
        openPins.push(openPinData[i][0])
    }
    pinIndex = openPins.indexOf(pin)
    recordingData = new Array()
    filepath = __dirname + "\\PIN" + JSON.stringify(openPinData[pinIndex][0]) + "RECORDING" + recordingCounter[pinIndex][1] + ".txt"
    fileData = new Array()
    console.log(recordingCounter[pinIndex][1])
    for (var i = 0; i < recordingCounter[pinIndex][1]; i++) {
        filepath = __dirname + "\\PIN" + JSON.stringify(openPinData[pinIndex][0]) + "RECORDING" + (i + 1) + ".txt"
        var data = fs.readFileSync(filepath, 'utf8')
        data = data.replaceAt(data.length - 1, "]")
        //data = data.replaceAt(data.length, ",")
        fileData.push(JSON.parse(data))
    }
    //fileData[pinIndex] = fileData.replaceAt(data.length - 2, "]")
    console.log(fileData)
    stringy = JSON.stringify(fileData)
    console.log(stringy)
    var downloadedRecordings = JSON.parse(stringy)
    filename = "Pin " + pin + " Recording" + recordingCounter[pinIndex][1]
    for (var i = 0; i < downloadedRecordings.length; i++) {
        download(client, filename, downloadedRecordings[i])
    }

}

//Function to send data back to the client
function download(client, filename, data) {
    var message = JSON.stringify({
        "title": "download",
        "filename": filename,
        "data": JSON.stringify(data)
    })
    for (var i = 0; i < connection.length; i++) {
        connection[connection.indexOf(client)].send(message)
    }
}


//Create a replace at to edit strings
String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}