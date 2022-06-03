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


// 좋아요 추가/삭제 API - cors preflight 처리 라우터
router.options('/', cors(corsOptions), (req, res) => {
    res.sendStatus(200);
});


// 좋아요 추가/삭제 API 
// require: user_key, board_key, isOn (json)
// isOn: true --> 추가: board의 cheer_count 1 증가, cheer에 새로운 튜플 생성 또는 is_on = true
// isOn: false --> 삭제: board의 cheer_count 1 감소, cheer에서 is_on = false
// 좋아요 처음 추가했을 때만 게시물 작성자의 선행포인트 1 증가
router.post('/', cors(corsOptions), (req, res) => {
    const isOn = req.body.isOn;
    const user_key = req.body.user_key;
    const board_key = req.body.board_key;

    if (isOn) { // 좋아요 추가
        const sql1 = `update board
                    set cheer_count = cheer_count + 1
                    where id = ${board_key};`; // 좋아요 수 증가 쿼리
        const sql2 = `select is_on
                    from cheer
                    where user_key = '${user_key}' and board_key = ${board_key};`; // 최초 추가인지 확인 쿼리
        
        pg.query(sql1+sql2, (err, rows) => {
            if (err) throw err;
            if (rows[1].rowCount) { // 최초 추가 X
                const sql3 = `update cheer
                            set is_on = true
                            where user_key = '${user_key}' and board_key = ${board_key};`; // is_on 수정 쿼리
                
                pg.query(sql3, (err) => {
                    if (err) throw err;
                    res.sendStatus(201);
                });
            } else { // 최초 추가 O
                const sql3 = `update profile
                            set total_point = total_point + 1, month_point = month_point + 1
                            where id = '${user_key}';`; // 작성자 선행 포인트 증가 쿼리
                const sql4 = `insert into cheer (user_key, board_key, is_on)
                            values ('${user_key}', ${board_key}, true);`; // 튜플 추가 쿼리

                pg.query(sql3+sql4, (err) => {
                    if (err) throw err;
                    res.sendStatus(201);
                });
            }
        });
    } else { // 좋아요 삭제
        const sql1 = `update board
                    set cheer_count = cheer_count - 1
                    where id = ${board_key} and cheer_count > 0;`; // 좋아요 수 감소 쿼리
        const sql2 = `update cheer
                    set is_on = false
                    where user_key = '${user_key}' and board_key = ${board_key};`; // is_on 수정 쿼리

        pg.query(sql1+sql2, (err) => {
            if (err) throw err;
            res.sendStatus(204);
        });
    }
});


// 좋아요 체크 여부 확인 API
// request: user_key, board_key (query string)
// response: is_on (json)
// 사용자가 해당 게시물에 좋아요를 눌렀는지 cheer table의 is_on 값으로 확인한다.
router.get('/', cors(corsOptions), (req, res) => {
    var responseData = {};
    const user_key = req.query.user_key;
    const board_key = req.query.board_key;

    const sql = `select is_on
                from cheer
                where user_key = '${user_key}' and board_key = ${board_key};`;

    pg.query(sql, (err, rows) => {
        if (err) throw err;
        if (rows.rowCount != 0) { // 좋아요 추가/취소 기록이 있는 경우 --> 기록 따라 전송
            responseData.is_on = rows.rows[0]['is_on'];
        } else { // 좋아요 추가/취소 기록이 없는 경우 --> 좋아요 누른 적이 없음.(false 전송)
            responseData.is_on = false;
        }
        res.status(200).json(responseData);
    });
});


module.exports = router;