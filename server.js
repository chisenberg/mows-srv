const path = require('path');
const express = require('express');
const apiRouter = require('./lib/api');
const app = express();

// Database
const Database  = require('./lib/database.js');
const db = new Database(__dirname +'/database.db');

// RF binary
const { spawn } = require('child_process');
const pulse433 = spawn('./bin/pulse433', []);
const BATTERY_CONSTANT = (3.3/256) * 1.422;

// Sends static files  from the public path directory
app.use(express.static(path.join(__dirname, '/public')));

// Serve index.html
app.get('/', function (req, res, next) {
	res.sendFile('./public/index.html');
	next();
});

//  Use routes defined in api/routes.js
app.use('/api', apiRouter);

const server = app.listen(8080, function () {
	let port = server.address().port;
	console.warn('listening at ', port);
});

// receive messages and save to database
pulse433.stdout.on('data', (data) => {
	let dataArray = data.toString().split(';');

	// TODO: check if message is ok before saving to database

	// var nMsg = parseInt(dataArray[0]);
	var temp = parseFloat(((parseInt(dataArray[2]) * 256 + parseInt(dataArray[3])) / 10).toFixed(2));
	var humid = parseFloat(((parseInt(dataArray[4]) * 256 + parseInt(dataArray[5])) / 10).toFixed(2));
	var batt = parseFloat((parseInt(dataArray[1]) * BATTERY_CONSTANT).toFixed(2));

	db.log({
		temperature: temp,
		humidity: humid,
		battery: batt
	}).catch((err) => {
		console.error('Failed to insert: ', err);
	});
});


