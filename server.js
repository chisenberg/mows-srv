const { spawn } = require('child_process');
// const Database  = require('./lib/database.js');
// const db = new Database();

const pulse433 = spawn('./bin/pulse433', []);

const BATTERY_CONSTANT = (3.3/256) * 1.432;

pulse433.stdout.on('data', (data) => {
	let dataArray = data.toString().split(';');
	console.warn(
		parseInt(dataArray[0]),
		parseFloat((parseInt(dataArray[1]) * BATTERY_CONSTANT).toFixed(2))
	);
});

pulse433.stderr.on('data', (data) => {
	console.error(`${data}`);
});

pulse433.on('close', (code) => {
	console.error(`child process exited with code ${code}`);
});