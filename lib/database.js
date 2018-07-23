const DBlite = require('dblite');
class Database{
	
	constructor(filePath){
		this.filePath = filePath;
		this.db = new DBlite(__dirname + '/' + this.filePath, '-header');
	}

	query(q) {
		return new Promise((resolve,reject) => {
			this.db.query(q, (err, rows) => {
				if(err) reject(err);
				else resolve(rows);
			});
		});
	}

	log(data) {

		return this.query(data);

		// var query = 'INSERT OR REPLACE INTO LOG (\
		// 	time,\
		// 	temperature,\
		// 	humidity,\
		// 	rain,\
		// 	pressure,\
		// 	wind_speed,\
		// 	wind_dir,\
		// 	batt\
		// ) VALUES ( \
		// 	strftime("%Y%m%d%H%M","now","localtime"),' + [
		//  	data.temperature
		// ].join(',');
			

		// this.db.query('aaa');
		// console.warn(
		// 	data.temp,
		// 	data.humid,
		// 	data.bat
		// );
	}

}

module.exports = Database;

/*
CREATE TABLE IF NOT EXISTS 'log' (
	'time'  TEXT NOT NULL,
	'temperature'  INTEGER,
	'humidity'  INTEGER,
	'rain'  REAL,
	'pressure'  INTEGER,
	'wind_speed'  INTEGER,
	'wind_dir'  INTEGER
	PRIMARY KEY ('time')
);
*/