const express = require('express');
const router = express.Router();
const pg = require('../db/index');


// 게시판의 한 페이지에 해당하는 게시물 조회 API
// request: tag, cursor (query string)
router.get('/', function(req,res) {
    var responseData = {};
    const tag = req.query.tag;
    const cursor = req.query.cursor; // 직전에 받았던 게시물의 cursor

    // cursor 기반 페이지네이션
    // 클라이언트가 가져간 마지막 row의 순서상 다음 row들을 10개 요청/응답하게 구현
    // 기준: cursor
    // cursor: created_at(14자) + id(10자) --> 24자 string
    // 가장 최근 게시물 10개를 받고 싶다면 cursor를 '999999999999999999999999'를 보내주면 됨.(9가 24개)
    // cursor가 클수록 최근 게시물
    // 직전에 받았던 게시물의 cursor보다 작은 cursor를 가지는 게시물들은 좀 더 오래된 게시물들
    const sql = `select id, user_key, content, image1, image2, image3, image4, view_count, cheer_count, updated_at, (to_char(created_at, 'YYYYMMDDHH24MISS') || lpad(id::text, 10, '0')) as cursor
                from board
                where tag = ${tag} and  (to_char(created_at, 'YYYYMMDDHH24MISS') || lpad(id::text, 10, '0')) < ${cursor}
                order by created_at desc, id desc
                limit 10;`;

    pg.query(sql, (err, rows) => {
        if (err) throw err;
        if (rows) {
            responseData.result = rows.rowCount;
            responseData.post = rows.rows;
        } else {
            responseData.result = 0;
        }
        res.status(200).json(responseData);
    });   
});


// 요청 받은 ID의 게시물 조회 API (게시물 상세 조회 API)
// request: id (parameter values)
router.get('/:id', (req, res) => {
    var responseData = {};
    const id = req.params.id;

    const sql1 = `update board 
                set view_count = view_count + 1 
                where id = ${id};`; // 조회수 증가 쿼리
    const sql2 = `select user_key, content, image1, image2, image3, image4, view_count, cheer_count, updated_at 
                from board 
                where id = ${id};`;

    pg.query(sql1+sql2, (err, rows) => {
        if (err) throw err;
        if (rows) {
            responseData.result = 1;
            responseData.post = rows[1].rows;
        } else {
            responseData.result = 0;
        }
        res.status(200).json(responseData);
    });
});


// 게시물 생성 API
// request: user_key, content, image1, image2, image3, image4, tag (json)
router.post('/', (req, res) => {
    const sql = `insert into board (user_key, content, image1, image2, image3, image4, tag) 
                values ($1, $2, $3, $4, $5, $6, $7);`;
    const dbInput = [req.body.user_key, req.body.content, req.body.image1, req.body.image2, req.body.image3, req.body.image4, req.body.tag];

    pg.query(sql, dbInput, (err) => {
        if (err) throw err;
        res.sendStatus(201);
    });
});


// 게시물 수정 API
// request: content, image1, image2, image3, image4 (json)
// 수정 안된 값도 그대로 json 파일에 포함시켜 꼭 보내주기!
// 안보내주면 자동으로 null 값으로 들어감.
router.post('/:id', (req, res) => {
    const id = req.params.id;

    const sql = `update board 
                set content = $1, image1 = $2, image2 = $3, image3 = $4, image4 = $5, updated_at = NOW() 
                where id = ${id};`;
    const dbInput = [req.body.content, req.body.image1, req.body.image2, req.body.image3, req.body.image4];

    pg.query(sql, dbInput, (err) => {
        if (err) throw err;
        res.sendStatus(201);
    });
});


// 게시물 삭제 API
// request: id (parameter values)
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const sql = `delete from board where id = ${id};`;

    pg.query(sql, (err) => {
        if (err) throw err;
        res.sendStatus(204);
    });
});


module.exports = router;