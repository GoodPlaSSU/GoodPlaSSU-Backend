const express = require('express');
const router = express.Router();
const pg = require('../db/index');

// query string으로 받은 id에 해당하는 게시글에 달린 댓글들 보내주는 api
router.get('/', function(req, res) {
	const id = req.query.id;	// url의 query string
	var responseData = {};	// 여기에 전송할 데이터 저장

	// 쿼리스트링 ?id={id}에서 comment 테이블의 board_key가 {id}인 rows 가져옴
	var query = pg.query(`select * from comment where board_key=${id}`, (err, rows) => {
		if (err) throw err;
		if (rows) {
			responseData.result = 1;	// 프론트에서 값이 있는지 없는지 확인하기 위한 용도
			responseData.post = rows.rows;
		} else {
			responseData.result = 0;
		}
		res.json(responseData);	// json으로 데이터를 보냄
	})
});

router.post('/', function(req, res) {
	// req.body로 프론트에서 submit한 값을 가져올 수 있음.
	// 이를 data 변수에 저장하면,
	// [Object: null prototype] {
	// 	user_key: '1',
	// 	board_key: '3',
	// 	content: 'new new new'
	// }
	// 이렇게 key-value 객체로 저장됨
	const data = req.body;
	// comment 테이블에 data 변수에 저장된 value를 해당하는 속성값에 넣어줌
	var query = pg.query(`insert into comment (user_key, board_key, content) values ($1, $2, $3)`, [data.user_key, data.board_key, data.content], (err) => {
		if (err) throw err;
	})
	// 저장이 잘 되었으면, res로 200 상태코드를 보내주게 했음
	res.sendStatus(200);
});

router.delete('/', function(req, res) {
	const id = req.query.id;	// url의 query string
	// ?id={id}일 때, comment 테이블에서 id가 {id}인 row 찾아서 삭제함
	var query = pg.query(`delete from comment where id=${id}`, (err) => {
		if (err) throw err;
	})
	// 저장이 잘 되었으면, res로 200 상태코드를 보내주게 했음
	res.sendStatus(200);
});

module.exports = router;