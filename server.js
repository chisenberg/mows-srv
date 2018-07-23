const { spawn } = require('child_process');
const Database  = require('./lib/database.js');
const db = new Database('dados.db');

const pulse433 = spawn('./bin/pulse433', []);

const BATTERY_CONSTANT = (3.3/256) * 1.422;

pulse433.stdout.on('data', (data) => {
	let dataArray = data.toString().split(';');

	var nMsg = parseInt(dataArray[0]);
	var temp = parseFloat(((parseInt(dataArray[2]) * 256 + parseInt(dataArray[3])) / 10).toFixed(2));
	var humid = parseFloat(((parseInt(dataArray[4]) * 256 + parseInt(dataArray[5])) / 10).toFixed(2));
	var batt = parseFloat((parseInt(dataArray[1]) * BATTERY_CONSTANT).toFixed(2));

	let log = db.log({
		temp: temp,
		humid: humid,
		batt: batt
	});
	
	log.then((rows) => {
		console.warn('then :) ', rows);
	}, (err) => {
		console.error('catch :( ', JSON.stringify(err));
	});

	console.warn('#', nMsg, batt, temp, humid);
});

process.on('unhandledRejection', error => {
	console.error('unhandledRejection', error.message);
});