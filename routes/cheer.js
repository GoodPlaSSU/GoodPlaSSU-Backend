const express = require('express');
const router = express.Router();
const pg = require('../db/index');


// 좋아요 추가 API
// board의 cheer_count 1 증가, cheer에 새로운 튜플 생성
// require: user_key, board_key (json)
router.post('/', (req, res) => {
    const user_key = req.body.user_key;
    const board_key = req.body.board_key;

    const sql1 = `update board
                set cheer_count = cheer_count + 1
                where id = ${board_key};`;
    const sql2 = `insert into cheer (user_key, board_key)
                values (${user_key}, ${board_key});`;

    pg.query(sql1+sql2, (err) => {
        if (err) throw err;
        res.sendStatus(201);
    });
});


// 좋아요 삭제 API
// board의 cheer_count 1 감소, cheer에서 해당 튜플 삭제
// require: user_key, board_key (json)
router.delete('/', (req, res) => {
    const user_key = req.body.user_key;
    const board_key = req.body.board_key;

    const sql1 = `update board
                set cheer_count = cheer_count - 1
                where id = ${board_key} and cheer_count > 0;`;
    const sql2 = `delete from cheer
                where user_key = ${user_key} and board_key = ${board_key};`;

    pg.query(sql1+sql2, (err) => {
        if (err) throw err;
        res.sendStatus(204);
    });
});


module.exports = router;