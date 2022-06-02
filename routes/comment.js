const express = require('express');
const router = express.Router();
const pg = require('../db/index');
const cors = require('cors');

const corsOptions = {
    origin: ["http://localhost:3000", "https://localhost:3000", "http://goodplassu.herokuapp.com", "https://goodplassu.herokuapp.com"],
    credentials : true,
    methods : 'GET,POST,DELETE,OPTIONS',
    optionSuccessStatus: 200
}

// query string으로 받은 id에 해당하는 게시글에 달린 댓글들 보내주는 api
router.get('/', cors(corsOptions), (req, res) => {
    // var origin = req.getHeader("origin");
    // if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
    //     res.setHeader('Access-Control-Allow-Origin', origin);
    // }
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

	const id = req.query.id;	// url의 query string
	var responseData = {};	// 여기에 전송할 데이터 저장

	// 쿼리스트링으로 받아온 id가 board_key이니까 그거 빼고 id, user_key, content, create_at만 보내줌
	// id는 그 댓글을 삭제할 때 id값을 받아야 하니까 포함시킴
	const sql = `select id, user_key, content, created_at from comment where board_key=${id}`;
	// 쿼리스트링 ?id={id}에서 comment 테이블의 board_key가 {id}인 rows 가져옴
	var query = pg.query(sql, (err, rows) => {
		if (err) throw err;
		if (rows) {
			responseData.result = rows.rowCount;	// 프론트에서 값이 있는지 없는지 확인하기 위한 용도
			responseData.comments = rows.rows;
		} else {
			responseData.result = 0;
		}
		res.status(200).json(responseData);	// 상태코드는 200(Ok), json 형식으로 데이터를 보냄
	})
});

router.post('/', (req, res) => {
    var origin = req.getHeader("origin");
    if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

	// req.body로 프론트에서 submit한 값을 가져올 수 있음.
	// 이를 data 변수에 저장하면,
	// [Object: null prototype] {
	// 	user_key: '1',
	// 	board_key: '3',
	// 	content: 'new new new'
	// }
	// 이렇게 key-value 객체로 저장됨
	const data = req.body;
	const sql = `insert into comment (user_key, board_key, content) values ($1, $2, $3)`;
	// comment 테이블에 data 변수에 저장된 value를 해당하는 속성값에 넣어줌
	var query = pg.query(sql, [data.user_key, data.board_key, data.content], (err) => {
		if (err) throw err;
		// 저장이 잘 되었으면, res로 상태코드 201(Created)를 보내줌
		res.sendStatus(201);
	})
});

router.delete('/', (req, res) => {
    var origin = req.getHeader("origin");
    if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

	const id = req.query.id;	// url의 query string
	// ?id={id}일 때, comment 테이블에서 id가 {id}인 row 찾아서 삭제함
	const sql = `delete from comment where id=${id}`;
	var query = pg.query(sql, (err) => {
		if (err) throw err;
		// 저장이 잘 되었으면, res로 상태코드 204(No Content)를 보내줌
		res.sendStatus(204);
	})
});

module.exports = router;