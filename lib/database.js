const dblite = require('dblite');
const async = require('async');

/*
CREATE TABLE IF NOT EXISTS 'log' (
	'time'  TEXT NOT NULL,
	'temperature'  INTEGER,
	'humidity'  INTEGER,
	'rain'  REAL,
	'pressure'  INTEGER,
	'wind_speed'  INTEGER,
	'wind_dir'  INTEGER,
	PRIMARY KEY ('time')
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

	// returns promise of the required query
	query(q, data) {
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

	// adds leading zeroes
	pad(str, digits)
	{
		return ('0000'+str).slice(-digits);
	}

	// returns yyyymmddHHMM from json {y m d}
	dateJson2Sqlite(ymd, h)
	{
		var output = this.pad(ymd.y,4) + this.pad(ymd.m,2) + this.pad(ymd.d,2);
		output += ('0'+h).slice(-2);
		output += '00'; //minutos
		return output;
	}

	// returns Json from a dd/mm/yyyy string
	dateString2Json(str)
	{
		return {
			d: str.substring(0,2),
			m: str.substring(3,5),
			y: str.substring(6,10)
		};
	}

	// converts string yyyymmddHHMM to milis since 1/1/1970
	dateSqlite2unix(string)
	{
		var yyyy = string.substring(0,4);
		var mm = string.substring(4,6);
		var dd = string.substring(6,8);
		var HH = string.substring(8,10);
		var MM = string.substring(10,12);
		return Date.UTC(yyyy,mm-1,dd,HH,MM,0,0);
	}

	getFormattedTime(timestamp, dateFilter)
	{
		var d = new Date(timestamp);
		if(dateFilter == 'years') return d.getUTCFullYear();
		else if(dateFilter == 'months') return  (1+d.getUTCMonth())+'/'+d.getUTCFullYear();
		else if(dateFilter == 'days') return  d.getUTCDate()+'/'+ (1+d.getUTCMonth())+'/'+d.getUTCFullYear();
		else if(dateFilter == 'hours') return d.getUTCDate()+'/'+ (1+d.getUTCMonth())+'/'+d.getUTCFullYear()+' '+d.getUTCHours()+'h';
	}

	report_create_query(start, end)
	{
		//var query = "SELECT min(time) as time, ROUND(sum(rain)) as rain,";
		return 'SELECT battery, ROUND(sum(rain)) as rain,'
		+ 'ROUND(min(temperature)) as temp_min, ROUND(max(temperature)) as temp_max, ROUND(avg(temperature)) as temperature,'
		+ 'ROUND(min(humidity)) as humid_min, ROUND(max(humidity)) as humid_max, ROUND(avg(humidity)) as humidity,'
		+ 'ROUND(min(pressure)) as press_min, ROUND(max(pressure)) as press_max, ROUND(avg(pressure)) as pressure,'
		+ 'ROUND(max(wind_speed)) as wind_speed_max, ROUND(avg(wind_speed)) as wind_speed'
		+ ' FROM log WHERE time > '+start+' AND time < '+end+';';
	}

	report_create_dates(start, end, dateFilter)
	{
		//array de saída. composto de array com date_small e date_big
		var result = new Array();

		//cria obj ymd a partir de datas inicio e fim
		var obj_start = this.dateString2Json(start);
		var obj_end = this.dateString2Json(end);
		
		//variáveis de controle do loop
		var hour_iterator = 0;
		var obj_iterator = obj_start;
		
		//ajustes para pegar os meses e anos inteiros
		if(dateFilter == 'months') obj_iterator['d']=1;
		else if(dateFilter == 'years'){ obj_iterator['d']=1; obj_iterator['m']=1; }
		
		// cria o array com as datas
		while( this.dateJson2Sqlite(obj_iterator,hour_iterator) < this.dateJson2Sqlite(obj_end,24))
		{
			//em cada ciclo, armazena anterior para query
			var date_small = this.dateJson2Sqlite(obj_iterator, hour_iterator);
		
			//incrementa conforme o filtro
			if(dateFilter == 'hours') hour_iterator++;
			else if(dateFilter == 'days') obj_iterator['d']++;
			else if(dateFilter == 'months') obj_iterator['m']++;
			else if(dateFilter == 'years') obj_iterator['y']++;
			else break;
			
			//incrementa depois do incremento ? :D
			//console.log(hour_iterator);
			if(hour_iterator > 24){hour_iterator=0; obj_iterator['d']++;}
			if(obj_iterator['d'] > 31){obj_iterator['d']=1; obj_iterator['m']++;}
			if(obj_iterator['m'] > 12){obj_iterator['m']=1; obj_iterator['y']++;}
			
			//depois do incremento para query
			var date_big = this.dateJson2Sqlite(obj_iterator, hour_iterator);
			
			//finalmente adiciona no array
			result.push([date_small, date_big]);
		}

		//retorna array com todos date_small e date_big
		return result;
	}

	report(start, end, dateFilter)
	{	
		return new Promise((resolve,reject) => {
			try {

				let self = this;
				
				async.map(
					
					// [ [start, end], [start, end], ...]
					this.report_create_dates(start, end, dateFilter),
					
					//função que vai ser executada para cada item do array acima
					function (item, callback) {
						
						//pega um item [start,end]
						var temp_date = item;
				
						//monta uma query com as datas e pesquisa no banco de dados
						var query = self.report_create_query(temp_date[0],temp_date[1]);

						self.query(query).then((rows) => {
							var row = rows[0];
							if(row.battery != '') {
								var epoch = self.dateSqlite2unix(temp_date[0]);
								row.formattedtime = self.getFormattedTime(epoch, dateFilter);
								callback(null,row);
							} else {
								callback(null);
							}
						});
					},

					//função com resultados
					(err,results) => {
						var final_result = new Array();
						for(var i in results){
							if(results[i] !== undefined)
								final_result.push(results[i]);
						}
						resolve(final_result);
					}
				);
			} catch (err) {
				reject(err);
			}
		});
	}


	now() {
		//querys
		let select1	= '(SELECT max(time) as time,'
		+ 'battery,'
		+ 'ROUND(SUM(rain)) as rain,'
		+ 'temperature as temp,'
		+ 'humidity as humid,'
		+ 'wind_speed as windSpeed,'
		+ 'wind_dir as windDir,'
		+ 'pressure as press'
		+ ' FROM log ) t1';
			
		let select2	= '(SELECT min(temperature) as tempMin, max(temperature) as tempMax,'
		+ 'min(humidity) as humidMin, max(humidity) as humidMax,'
		+ 'min(wind_speed) as windSpeedMin, max(wind_speed) as windSpeedMax,'
		+ 'min(pressure) as nowPressureMin, max(pressure) as now_press_max '
		+ 'FROM log WHERE time > strftime("%Y%m%d0000","now", "localtime") ) t2';

		let nowQuery = 'SELECT t1.time, t1.battery, '
		+ 't1.rain,'
		+ 't1.temp, t2.tempMin, t2.tempMax, '
		+ 't1.humid, t2.humidMin, t2.humidMax, '
		+ 't1.windSpeed, t2.windSpeedMin, t2.windSpeedMax, '
		+ 't1.windDir, '
		+ 't1.press, t2.nowPressureMin, t2.now_press_max '
		+ 'FROM ' + select1 + ',' + select2;

		return this.query(nowQuery, null);
	}

	record(data) {
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