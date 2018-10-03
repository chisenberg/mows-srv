const dblite = require('dblite');

/*
CREATE TABLE IF NOT EXISTS "log" (
	"time"  TEXT NOT NULL,
	"temperature"  INTEGER,
	"humidity"  INTEGER,
	"rain"  REAL,
	"pressure"  INTEGER,
	"wind_speed"  INTEGER,
	"wind_dir"  INTEGER,
	PRIMARY KEY ("time")
);
*/

class Database{
	
	constructor(filePath){
		this.db = dblite(filePath, '-header');

		this.db.on('error', (err) => {
			console.error('dblite error!', err.toString());
		});
		this.db.on('info', (info) => {
			console.warn(info.toString());
		});
		this.db.on('close', () => {
			console.warn('dblite closed!');
		});
	}

	query(q,data) {
		return new Promise((resolve,reject) => {
			try {
				this.db.query(q, data, (err, rows) => {
					if(err) reject(err);
					else resolve(rows);
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	last() {
		var query = 'SELECT max(time) as time,* FROM LOG;';
		return this.query(query,null);
	}

	log(data) {
		var query = 'INSERT OR REPLACE INTO LOG VALUES (\
			strftime("%Y%m%d%H%M","now","localtime"),\
			:temperature,\
			:humidity,\
			:rain,\
			:pressure,\
			:wind_speed,\
			:wind_dir,\
			:battery\
		);';
		
		return this.query(query,data);
	}

}

module.exports = Database;