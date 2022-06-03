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


// 사용자 정보 조회 API
// request: id (parameter values) --> 없는 사용자일 경우 404 에러뜨기
router.get('/user/:id', cors(corsOptions), (req, res) => {
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
router.get('/mypost', cors(corsOptions), async(req, res) => {
    var responseData = {};
    const id = req.query.id;
    const cursor = req.query.cursor;

    try {
        const sql1 = `select id, content, image1, image2, image3, image4, view_count, cheer_count, updated_at, tag, (to_char(board.created_at, 'YYYYMMDDHH24MISS') || lpad(board.id::text, 10, '0')) as cursor
                    from board
                    where board.user_key = '${id}' and (to_char(board.created_at, 'YYYYMMDDHH24MISS') || lpad(board.id::text, 10, '0')) < '${cursor}'
                    order by cursor desc
                    limit 10;`; // 게시글 조회 쿼리
        const sql2 = `select name, portrait
                    from profile
                    where id = '${id}';`; // 작성자 정보 조회 쿼리
        const sql3 = `select is_on
                    from cheer
                    where user_key = '${id}' and board_key = $1;`; // 로그인 유저 좋아요 누름 확인 쿼리


        var boardRes = await pg.query(sql1); // 게시글 조회
        if (boardRes.rowCount != 0) {
            responseData.result = boardRes.rowCount;
            responseData.post = boardRes.rows;
        } else {
            responseData.result = 0;
        }
        
        for (var i = 0; i < boardRes.rowCount; i++) {
            var profileRes = await pg.query(sql2); // 작성자 이름, 프로필 사진 조회
            if (profileRes.rowCount != 0) {
                responseData.writer_result = 1;
                responseData.post[i]['writer_name'] = profileRes.rows[0]['name'];
                responseData.post[i]['wirter_portrait'] = profileRes.rows[0]['portrait'];
            } else {
                responseData.writer_result = 0;
            }

            var cheerRes = await pg.query(sql3, [boardRes.rows[i]['id']]); // 로그인 유저의 좋아요 누름 여부 확인하기
            if (cheerRes.rowCount != 0) { // 좋아요 추가/취소 기록 있으면 해당 기록 response
                responseData.post[i].is_on = cheerRes.rows[0]['is_on'];
            } else { // 좋아요 추가/취소 기록 없으면 좋아요 추가X이므로 false response
                responseData.post[i].is_on = false;
            }
        }

        res.status(200).json(responseData);

    } catch (err) {
        throw err;
    }
});


// 내가 댓글 쓴 게시물 조회 API (10개씩)
// request: id, cursor (query string)
router.get('/mycomment', cors(corsOptions), async(req, res) => {
    var responseData = {};
    const id = req.query.id;
    const cursor = req.query.cursor;

    try {
        const sql1 = `select distinct b.id, b.user_key, b.content, b.image1, b.image2, b.image3, b.image4, b.view_count, b.cheer_count, b.updated_at, b.tag, (to_char(b.created_at, 'YYYYMMDDHH24MISS') || lpad(b.id::text, 10, '0')) as cursor
                    from comment as c
                    inner join board as b
                    on b.id = c.board_key
                    where c.user_key = '${id}' and (to_char(b.created_at, 'YYYYMMDDHH24MISS') || lpad(b.id::text, 10, '0')) < '${cursor}'
                    order by cursor desc
                    limit 10;`;
        const sql2 = `select name, portrait
                    from profile
                    where id = $1;`; // 작성자 정보 조회 쿼리
        const sql3 = `select is_on
                    from cheer
                    where user_key = '${id}' and board_key = $1;`; // 로그인 유저 좋아요 누름 확인 쿼리


        var boardRes = await pg.query(sql1); // 게시글 조회
        if (boardRes.rowCount != 0) {
            responseData.result = boardRes.rowCount;
            responseData.post = boardRes.rows;
        } else {
            responseData.result = 0;
        }
        
        for (var i = 0; i < boardRes.rowCount; i++) {            
            var profileRes = await pg.query(sql2, [boardRes.rows[i]['user_key']]); // 작성자 이름, 프로필 사진 조회
            if (profileRes.rowCount != 0) {
                responseData.writer_result = 1;
                responseData.post[i]['writer_name'] = profileRes.rows[0]['name'];
                responseData.post[i]['wirter_portrait'] = profileRes.rows[0]['portrait'];
            } else {
                responseData.writer_result = 0;
            }
            
            var cheerRes = await pg.query(sql3, [boardRes.rows[i]['id']]); // 로그인 유저의 좋아요 누름 여부 확인하기
            if (cheerRes.rowCount != 0) { // 좋아요 추가/취소 기록 있으면 해당 기록 response
                responseData.post[i].is_on = cheerRes.rows[0]['is_on'];
            } else { // 좋아요 추가/취소 기록 없으면 좋아요 추가X이므로 false response
                responseData.post[i].is_on = false;
            }
        }

        res.status(200).json(responseData);

    } catch (err) {
        throw err;
    }
});


// 내가 좋아요 누른 게시물 조회 API (10개씩)
// request: id, cursor (query string)
router.get('/mycheer', cors(corsOptions), async(req, res) => {
    var responseData = {};
    const id = req.query.id;
    const cursor = req.query.cursor;

    try {
        const sql1 = `select b.id, b.user_key, b.content, b.image1, b.image2, b.image3, b.image4, b.view_count, b.cheer_count, b.updated_at, b.tag, (to_char(b.created_at, 'YYYYMMDDHH24MISS') || lpad(b.id::text, 10, '0')) as cursor
                    from cheer as c
                    inner join board as b
                    on b.id = c.board_key
                    where c.user_key = '${id}' and c.is_on = true and (to_char(b.created_at, 'YYYYMMDDHH24MISS') || lpad(b.id::text, 10, '0')) < '${cursor}'
                    order by cursor desc
                    limit 10;`;
        const sql2 = `select name, portrait
                    from profile
                    where id = $1;`; // 작성자 정보 조회 쿼리

        var boardRes = await pg.query(sql1); // 게시글 조회
        if (boardRes.rowCount != 0) {
            responseData.result = boardRes.rowCount;
            responseData.post = boardRes.rows;
        } else {
            responseData.result = 0;
        }
        
        for (var i = 0; i < boardRes.rowCount; i++) {
            var profileRes = await pg.query(sql2, [boardRes.rows[i]['user_key']]); // 작성자 이름, 프로필 사진 조회
            if (profileRes.rowCount != 0) {
                responseData.writer_result = 1;
                responseData.post[i]['writer_name'] = profileRes.rows[0]['name'];
                responseData.post[i]['wirter_portrait'] = profileRes.rows[0]['portrait'];
            } else {
                responseData.writer_result = 0;
            }

            // 좋아요 누른 게시물 조회니까
            // 로그인 유저의 좋아요 누름 여부는 다 true
            responseData.post[i].is_on = true;
        }

        res.status(200).json(responseData);

    } catch (err) {
        throw err;
    }    
});


module.exports = router;