const express = require('express');
const router = express.Router();
const pg = require('../db/index');

// 사용자 정보 조회 API
// request: id (parameter values) --> 없는 사용자일 경우 404 에러뜨기
router.get('/user/:id', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    var responseData = {};
    const id = req.params.id;

    const sql = `select name, portrait, total_point, month_point
                from profile
                where id = '${id}';`;

    pg.query(sql, (err, rows) => {
        if (err) throw err;
        if (rows) {
            responseData.result = 1;
            responseData.user = rows.rows;
        } else {
            responseData.result = 0;
        }
        res.status(200).json(responseData);
    });
});


// 내가 쓴 게시물 조회 API (10개씩)
// request: id, cursor (query string)
router.get('/mypost', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    var responseData = {};
    const id = req.query.id;
    const cursor = req.query.cursor;

    const sql = `select id, writer_name, writer_portrait, content, image1, image2, image3, image4, view_count, cheer_count, updated_at, (to_char(board.created_at, 'YYYYMMDDHH24MISS') || lpad(board.id::text, 10, '0')) as cursor
                from board
                where board.user_key = '${id}' and (to_char(board.created_at, 'YYYYMMDDHH24MISS') || lpad(board.id::text, 10, '0')) < '${cursor}'
                order by cursor desc
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


// 내가 댓글 쓴 게시물 조회 API (10개씩)
// request: id, cursor (query string)
router.get('/mycomment', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    var responseData = {};
    const id = req.query.id;
    const cursor = req.query.cursor;

    const sql = `select distinct b.id, b.writer_name, b.writer_portrait, b.content, b.image1, b.image2, b.image3, b.image4, b.view_count, b.cheer_count, b.updated_at, (to_char(b.created_at, 'YYYYMMDDHH24MISS') || lpad(b.id::text, 10, '0')) as cursor
                from comment as c
                inner join board as b
                on b.id = c.board_key
                where c.user_key = '${id}' and (to_char(b.created_at, 'YYYYMMDDHH24MISS') || lpad(b.id::text, 10, '0')) < '${cursor}'
                order by cursor desc
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


// 내가 좋아요 누른 게시물 조회 API (10개씩)
// request: id, cursor (query string)
router.get('/mycheer', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    var responseData = {};
    const id = req.query.id;
    const cursor = req.query.cursor;

    const sql = `select b.id, b.writer_name, b.writer_portrait, b.content, b.image1, b.image2, b.image3, b.image4, b.view_count, b.cheer_count, b.updated_at, (to_char(b.created_at, 'YYYYMMDDHH24MISS') || lpad(b.id::text, 10, '0')) as cursor
                from cheer as c
                inner join board as b
                on b.id = c.board_key
                where c.user_key = '${id}' and c.is_on = true and (to_char(b.created_at, 'YYYYMMDDHH24MISS') || lpad(b.id::text, 10, '0')) < '${cursor}'
                order by cursor desc
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


module.exports = router;