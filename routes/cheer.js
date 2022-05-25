const express = require('express');
const router = express.Router();
const pg = require('../db/index');


// 좋아요 추가/삭제 API
// require: user_key, board_key, isOn (json)
// isOn: true --> 추가: board의 cheer_count 1 증가, cheer에 새로운 튜플 생성
// isOn: false --> 삭제: board의 cheer_count 1 감소, cheer에서 튜플 삭제
router.post('/', (req, res) => {
    const isOn = req.body.isOn;
    const user_key = req.body.user_key;
    const board_key = req.body.board_key;

    if (isOn) { // 좋아요 추가
        const sql1 = `update board
                    set cheer_count = cheer_count + 1
                    where id = ${board_key};`; // 좋아요 수 증가 쿼리
        const sql2 = `update profile
                    set total_point = total_point + 1, month_point = month_point + 1
                    where id = ${user_key};`; // 작성자 선행 포인트 증가 쿼리
        const sql3 = `insert into cheer (user_key, board_key)
                    values (${user_key}, ${board_key});`;

        pg.query(sql1+sql2+sql3, (err) => {
            if (err) throw err;
            res.sendStatus(201);
        });
    } else { // 좋아요 삭제
        const sql1 = `update board
                    set cheer_count = cheer_count - 1
                    where id = ${board_key} and cheer_count > 0;`; // 좋아요 수 감소 쿼리
        const sql2 = `delete from cheer
                    where user_key = ${user_key} and board_key = ${board_key};`;

        pg.query(sql1+sql2, (err) => {
            if (err) throw err;
            res.sendStatus(204);
        });
    }
});


module.exports = router;