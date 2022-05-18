const express = require('express');
const router = express.Router();

const db = require('../db/index');

router.get('/', function(req, res) {
    var id = req.query.id;
    var responseData = {};

    var query = pg.query('select * from board where id=' + id, (err, rows) => {
        if (err) throw err;
        if (rows) {
            responseData.result = 1;
            responseData.post = rows.rows;
        } else {
            responseData.result = 0;
        }
        res.json(responseData);
    })
});

module.exports = router;