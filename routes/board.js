const express = require('express');
const router = express.Router();

const db = require('../db/index');

router.get('/board', (req,res) => {
    var responseData = {};

    const sql = 'select * from board order by created_at desc;';
    db.query(sql, (err, rows) => {
        if (err) console.log(err.stack);
        if (rows) {
            responseData.result = 1;
            responseData.data = rows.rows;
        } else {
            responseData.result = 0;
        }
    });

    res.json(responseData);
});