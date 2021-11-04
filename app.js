// SERVER SETUP

//Create base HTTP server
const http = require('http')
var fs = require('fs')
var XLSX = require('xlsx')
var rpio = require('rpio')
var path = require('path')

const httpserver = http.createServer((req, res) => {
    console.log('We recieved a request for an html server?')
})

//Create websocket server
const WebSocketServer = require('websocket').server
const { setgroups } = require('process')
const wss = new WebSocketServer({
    "httpServer": httpserver
})

//Initialization code to read the saved openPinData.json file
stateFilePath = __dirname + "/stateManager.json"
//var data = fs.readFileSync(stateFilePath, 'utf8')
//openPinData = JSON.parse(data)
//fs.writeFileSync(stateFilePath, JSON.stringify(openPinData))
//console.log(openPinData)


//Set http server to listen to port 3000
httpserver.listen(3000, () => console.log('listening on port 3000'))

//Create connection array to store all connections
var connection = new Array()

//Accept all connection requests
wss.on("request", request => {
    var client = request.accept()
    connection.push(client)
    console.log("Connection request accepted")
    connection[connection.indexOf(client)].send(JSON.stringify({ "title": "Connected", "database": database }))
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
        if (jsonparse.title == "record-all") {
            startRecordingAll()
        }
        if (jsonparse.title == "stop-record-all") {
            stopRecordingAll()
        }
        if (jsonparse.title == "delete-recordings") {
            deleteRecordings()
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


//Create a test JSON array 
var chartData = {
    title: "chart-data",
    message: "This is the server"
}

var database = new Array()

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
        var graphWidth = 0
        openPinData.push([JSON.parse(gpioPin), false, data, timestamps, recordingCounter, [[], []], graphWidth, new Array(), new Array(), new Array()])
        recordingCounter = 0
        console.log("Opening GPIO pin:" + gpioPin)
        rpio.open(gpioPin, rpio.INPUT)
        database.push(new Array())
        getSensorData()
    }
    alreadyOpen = false

}

//Function to close a gpio pin
function closePin(gpioPin) {
    //Remove the port from open pins

    var wasntOpen = true
    var length = openPinData.length
    for (var i = 0; i < length; i++) {
        if (openPinData[i][0] == gpioPin) {

            console.log("Closing GPIO pin:" + gpioPin)
            wasntOpen = false

            //Edit fileManager to remove the previous recordings

            var fs = require('fs')
            for (var j = 0; j < openPinData[i][4]; j++) {
                fs.unlinkSync(openPinData[i][5][j][0], function (err) { })
                openPinData[i][5][j][1].end()
            }

            //Must be the very last line
            openPinData.splice(i, 1)
            rpio.close(gpioPin)
        }
    }
    if (wasntOpen) {
        console.log("Pin already closed!")
    }
    wasntOpen = true
}

//Function to close all open pins
function closeAllPins() {
    var fs = require('fs')
    console.log("Clearing all open pins")
    //Edit fileManager to remove the previous recordings
    var length = openPinData.length
    for (var i = 0; i < length; i++) {
        for (var j = 0; j < openPinData[i][4]; j++) {
            console.log("closing below file")
            fs.unlinkSync(openPinData[i][5][j][0], function (err) { console.log("Couldnt close") })
            openPinData[i][5][j][1].end()

        }
        rpio.close(openPinData[i][0])
    }
    openPinData = new Array()
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
                var filepath = __dirname + "/PIN" + JSON.stringify(openPinData[i][0]) + "RECORDING" + openPinData[i][4] + ".txt"
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
var pollingRate = 1


setInterval(getSensorData, 0)

function getSensorData() {
    for (var i = 0; i < openPinData.length; i++) {
        var deltaTime = Date.now() - openPinData[i][7]
        var randomVariable = rpio.read(openPinData[i][0])
        var pinTimeData = [deltaTime, randomVariable]
        openPinData[i][7] = Date.now()
        console.log(openPinData[i][8].length)

        openPinData[i][8].push(randomVariable)
        openPinData[i][9].push(deltaTime)
    }
}



setInterval(evaluateSensorData, 1)
function evaluateSensorData() {
    console.log("Running evaluate!")
    //console.log("running for " + openPinData.length)
    for (var i = 0; i < openPinData.length; i++) {


        for (var k = 0; k < openPinData[i][8].length; k++) {
            openPinData[i][2].push(openPinData[i][8][k])
            openPinData[i][3].push(openPinData[i][9][k])
            if (openPinData[i][2].length > 3000) {
                openPinData[i][2].splice(0, 1)
                openPinData[i][3].splice(0, 1)
            }
            var pinTimeData = [openPinData[i][9], openPinData[i][8]]
            database[i].push(pinTimeData)
        }
        console.log(openPinData)
        openPinData[i][8] = new Array()
        openPinData[i][9] = new Array()


        //Here we check if recording, if we are we throw data point into recording file. 
        if (openPinData[i][1] == true) {
            if (firstRecordingLoop[i]) {
                var fs = require('fs')
                console.log("first recordiung loop creating new streams")

                openPinData[i][4]++

                var writeStreamName = "PIN" + JSON.stringify(openPinData[i][0]) + "RECORDING" + openPinData[i][4] + ".txt"

                var fileManagerWriteStream = fs.createWriteStream('fileManager.txt', {
                    flags: 'a'
                })
                fileManagerWriteStream.write(writeStreamName + ",")
                fileManagerWriteStream.close()


                //Here is the code that initializes the write streams
                var writeStreamName = "PIN" + JSON.stringify(openPinData[i][0]) + "RECORDING" + openPinData[i][4] + ".txt"

                var writeStream = fs.createWriteStream(writeStreamName, {
                    flags: 'a'
                })
                openPinData[i][5].push([[], []])
                openPinData[i][5][openPinData[i][4] - 1][0] = writeStreamName
                openPinData[i][5][openPinData[i][4] - 1][1] = writeStream
                writeStream.write("[" + JSON.stringify(pinTimeData) + ",")
                console.log(openPinData)
                firstRecordingLoop[i] = false
            } else {
                writeStream = openPinData[i][5][openPinData[i][4] - 1][1]
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
    var filename = "Passive Pin " + pin + " Data"
    download(client, filename, database, true)
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
    filepath = __dirname + "/PIN" + JSON.stringify(openPinData[pinIndex][0]) + "RECORDING" + openPinData[pinIndex][4] + ".txt"
    fileData = new Array()
    //console.log(openPinData[pinIndex][4])
    for (var i = 0; i < openPinData[pinIndex][4]; i++) {
        filepath = __dirname + "/PIN" + JSON.stringify(openPinData[pinIndex][0]) + "RECORDING" + (i + 1) + ".txt"
        var data = fs.readFileSync(filepath, 'utf8')
        data = data.replaceAt(data.length - 1, "]")
        //data = data.replaceAt(data.length, ",")
        fileData.push(data)
    }
    //fileData[pinIndex] = fileData.replaceAt(data.length - 2, "]")
    stringy = JSON.stringify(fileData)
    var downloadedRecordings = JSON.parse(stringy)
    filename = "Pin " + pin + " Recordings"
    console.log(downloadedRecordings)
    download(client, filename, downloadedRecordings)


}

//Function to send data back to the client
function download(client, filename, data, passive) {

    var workbook = XLSX.utils.book_new()
    workbook.Props = {
        Title: filename,
        Author: "Script and server created by Jack Taylor"
    }
    console.log(data)
    for (var i = 0; i < data.length; i++) {
        if (passive) {
            console.log(data[i])
            workbook.SheetNames.push("Recording " + (i + 1))
            var worksheet = XLSX.utils.aoa_to_sheet(data[i])
            workbook.Sheets["Recording " + (i + 1)] = worksheet
        } else {
            console.log(data[i])
            console.log(JSON.parse(data[i]))
            workbook.SheetNames.push("Recording " + (i + 1))
            var worksheet = XLSX.utils.aoa_to_sheet(JSON.parse(data[i]))
            workbook.Sheets["Recording " + (i + 1)] = worksheet
        }
    }

    var workbookOutput = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' })

    var message = JSON.stringify({
        "title": "download",
        "filename": filename,
        "data": data,
        "workbookOutput": workbookOutput
    })
    connection[connection.indexOf(client)].send(message)
}

//Create a replace at to edit strings
String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}


function startRecordingAll() {
    for (var i = 0; i < openPinData.length; i++) {
        openPinData[i][1] = true
        firstRecordingLoop[i] = true
    }
}

function stopRecordingAll() {
    for (var i = 0; i < openPinData.length; i++) {
        openPinData[i][1] = false
        var filepath = __dirname + "/PIN" + JSON.stringify(openPinData[i][0]) + "RECORDING" + openPinData[i][4] + ".txt"
        var fs = require('fs')
        var data = fs.readFileSync(filepath, 'utf8')
        data = data.replaceAt(data.length - 1, "]")
    }
}

function deleteRecordings() {
    console.log("Deleting all recording files!")
    fromDir("/home/ubuntu/web-sockets", ".txt")
}

function fromDir(startPath, filter) {

    //console.log('Starting from dir '+startPath+'/');

    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath)
        return;
    }

    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (filename.indexOf(filter) >= 0) {
            fs.unlinkSync(filename)
        };
    };
};