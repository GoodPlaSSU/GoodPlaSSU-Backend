const express = require('express');
const router = express.Router();
const pg = require('../db/index');
const cors = require('cors');


// cors 옵션 설정
const corsOptions = {
    origin: ["http://localhost:3000", "https://localhost:3000", "http://goodplassu.herokuapp.com", "https://goodplassu.herokuapp.com"],
    credentials : true,
    methods : 'GET,POST,DELETE,OPTIONS',
    optionSuccessStatus: 200
}


router.get('/', cors(corsOptions), (req, res) => {
	var responseData = {};	// 여기에 전송할 데이터 저장

	// ad 테이블에서 기관 광고 목록을 id 내림차순으로 보내줌
	// 먼저 들어온 광고의 id가 작은 수이므로 최근에 들어온 광고가 먼저 나올 수 있게
	const sql = `select * from ad order by id desc`;
	var query = pg.query(sql, (err, rows) => {
		if (err) throw err;
		if (rows) {
			responseData.result = rows.rowCount;	// 프론트에서 값이 있는지 없는지 확인하기 위한 용도
			responseData.ads = rows.rows;
		} else {
			responseData.result = 0;
		}
		res.status(200).json(responseData);	// 상태코드는 200(Ok), json 형식으로 데이터를 보냄
	})
});

module.exports = router;