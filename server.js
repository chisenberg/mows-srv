const { spawn } = require('child_process');
const database = require('./lib/database.js');

const pulse433 = spawn('./bin/pulse433', []);

pulse433.stdout.on('data', (data) => {
	console.log(`${data}`);
	database.getnow();
});

pulse433.stderr.on('data', (data) => {
	console.log(`stderr: ${data}`);
});

pulse433.on('close', (code) => {
	console.log(`child process exited with code ${code}`);
});