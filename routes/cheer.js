const express = require('express');
const router = express.Router();
const pg = require('../db/index');


// 좋아요 추가/삭제 API 
// require: user_key, board_key, isOn (json)
// isOn: true --> 추가: board의 cheer_count 1 증가, cheer에 새로운 튜플 생성 또는 is_on = true
// isOn: false --> 삭제: board의 cheer_count 1 감소, cheer에서 is_on = false
// 좋아요 처음 추가했을 때만 게시물 작성자의 선행포인트 1 증가
router.post('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

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


module.exports = router;