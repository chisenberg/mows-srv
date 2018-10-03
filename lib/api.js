const express = require('express');
const apiRouter = express.Router();

// get all logs
apiRouter.route('/all').get(function (req, res) {
// if (err) {
//   return next(new Error(err))
// }

// root path
// app.get('/', function (req, res) {

// 	db.last().then((rows) => {
// 		if(rows != null && rows.length > 0)
// 			res.send(rows[0]);
// 	});
// });

	res.json();
});

module.exports = apiRouter;