const { spawn } = require('child_process');
const express = require('express');
const app = express();

const Database  = require('./lib/database.js');
const db = new Database(__dirname +'/dados.db');

const BATTERY_CONSTANT = (3.3/256) * 1.422;

const pulse433 = spawn('./bin/pulse433', []);


app.get('/', function (req, res) {
	db.last().then((rows) => {
		res.send(rows[0]);
	});
});

const server = app.listen(8080, function () {
	let port = server.address().port;
	console.warn('listening at ', port);
});

pulse433.stdout.on('data', (data) => {
	let dataArray = data.toString().split(';');

	var nMsg = parseInt(dataArray[0]);
	var temp = parseFloat(((parseInt(dataArray[2]) * 256 + parseInt(dataArray[3])) / 10).toFixed(2));
	var humid = parseFloat(((parseInt(dataArray[4]) * 256 + parseInt(dataArray[5])) / 10).toFixed(2));
	var batt = parseFloat((parseInt(dataArray[1]) * BATTERY_CONSTANT).toFixed(2));

	db.log({
		temperature: temp,
		humidity: humid
	}).catch((err) => {
		// console.error('CATCHAU', err);
	});

	// db.last({
	// 	temperature: temp,
	// 	humidity: humid
	// }).then((rows) => {
	// 	console.warn(rows);
	// });
});


