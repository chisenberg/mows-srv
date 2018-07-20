const DBlite = require('dblite');

class Database{
	
	constructor(filePath){
		this.filePath = filePath;
		this.db = new DBlite(__dirname + this.filePath, '-header');
	}

	

}

module.exports = Database;