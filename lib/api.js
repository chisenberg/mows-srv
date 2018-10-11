const express = require('express');
const _ = require('underscore');

class Api {
	
	constructor(database){
		_.bindAll(this, 'now', 'period');
		this.db = database;
		this.router = express.Router();
		this.router.route('/now').get(this.now);
		this.router.route('/period').get(this.period);
	}

	now(req, res) {
		this.db.now().then((rows) => {
			res.json(rows);
		});
	}

	period(req, res){
		var start = req.query.start;
		var end = req.query.end;
		var filter = req.query.filter;

		this.db.report(start, end, filter).then((rows) => {
			res.json(rows);
		});
	}
	
}

module.exports = Api;