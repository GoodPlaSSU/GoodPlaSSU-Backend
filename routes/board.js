const express = require('express');
const router = express.Router();

const pg = require('../db/index');

// 게시판의 한 페이지에 해당하는 게시물 조회 API
router.get('/', function(req,res) {
    var responseData = {};
    const tag = req.query.tag;

    const sql = `select * from board order by created_at desc;`;

    pg.query(sql, (err, rows) => {
        if (err) console.log(err.stack);
        if (rows) {
            responseData.result = 1;
            responseData.data = rows.rows;
        } else {
            responseData.result = 0;
        }
    });

    res.json(responseData);
    res.sendStatus(200);
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

    var query = pg.query(sql1 + sql2, (err, rows) => {
        if (err) throw err;
        if (rows) {
            responseData.result = 1;
            responseData.post = rows.rows;
        } else {
            responseData.result = 0;
        }
    });

    res.json(responseData);
    res.sendStatus(200);
});


// 게시물 생성 API
// request: user_key, content, image1, image2, image3, image4, tag (json)
router.post('/', (req, res) => {
    const data = req.body;

    const sql = `insert into board (user_key, content, image1, image2, image3, image4, tag) 
                values ($1, $2, $3, $4, $5, $6, $7);`;
    const dbInput = [data.user_key, data.content, data.image1, data.image2, data.image3, data.image4, data.tag];

    var query = pg.query(sql, dbInput, (err) => {
        if (err) throw err;
    });

    res.sendStatus(201);
});


// 게시물 수정 API
// request: content, image1, image2, image3, image4 (json)
router.post('/:id', (req, res) => {
    const id = req.params.id;
    const data = req.body;

    const sql = `update board 
                set content = $1, image1 = $2, image2 = $3, image3 = $4, image4 = $5, updated_at = NOW() 
                where id = ${id};`;
    const dbInput = [data.content, data.image1, data.image2, data.image3, data.image4];

    var query = pg.query(sql, dbInput, (err) => {
        if (err) throw err;
    });
    
    res.sendStatus(201);
});


// 게시물 삭제 API
// request: id (parameter values)
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const sql = `delete from board where id = ${id};`;

    var query = pg.query(sql, (err) => {
        if (err) throw err;
    });

    res.sendStatus(204);
});


module.exports = router;