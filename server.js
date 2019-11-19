// const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');

// Database
const Database = require('./libs/database.js');
const db = new Database(__dirname +'/database.db');

// api router with database
const Api = require('./libs/api');
const api = new Api(db);

// RF binary
const { spawn } = require('child_process');
const pulse433 = spawn('./bin/pulse433', []);
const BATTERY_CONSTANT = (3.3/256) * 1.422;

// Express use CORS
app.use(cors());

//  Use routes defined in api/routes.js
app.use('/api', api.router);

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

	db.record({
		temperature: temp,
		humidity: humid,
		battery: batt
	}).catch((err) => {
		console.error('Failed to insert: ', err);
	});
});


