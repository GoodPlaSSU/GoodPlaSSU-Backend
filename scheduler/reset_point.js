const pg = require('../db/index');

function reset_month_point() {
	// 모든 유저의 month_point 값 0으로 초기화
	const sql = `update profile set month_point=0;`;
	pg.query(sql, (err) => {
		if (err) throw err;
	})
}

// 오늘 날짜 가져옴
var today = new Date();
// 오늘 날짜에서 며칠인지 가져옴 (1~최대31)
var date = today.getDate();

// 1일일 때만 함수 실행
if (date == 1)
	reset_month_point();
