const pg = require('../db/index');

function reset_month_point() {
	const sql = `update profile set month_point=0;`;
	pg.query(sql, (err) => {
		if (err) throw err;
	})
}

var today = new Date();
var date = today.getDate();

if (date == 1)
	reset_month_point();
