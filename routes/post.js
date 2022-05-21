const express = require('express');
const router = express.Router();

const pg = require('../db/index');

// 요청 받은 ID의 게시물 정보 보내기
router.get('/', (req, res) => {
    var id = req.query.id;
    var responseData = {};

    const sql = 'select * from board where id=' + id;
    var query = pg.query(sql, (err, rows) => {
        if (err) throw err;
        if (rows) {
            responseData.result = 1;
            responseData.post = rows.rows;
        } else {
            responseData.result = 0;
        }
    })

    res.json(responseData);
    res.sendStatus(200);
});

module.exports = router;