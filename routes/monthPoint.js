const express = require('express');
const router = express.Router();
const pg = require('../db/index');

// 이달의 선행왕 선정 API
router.get('/', (req, res) => {
    var responseData = {};

    const sql1 = `select max(month_point) from profile;`;

    pg.query(sql1, (err, rows) => {
        if (err) throw err;
        if (rows) {
            const maxPoint = rows.rows[0].month_point;

            if (rows.rowCount == 0 || maxPoint == 0) {
                responseData.result = 0;
                res.status(200).json(responseData);
            } else {
                const sql2 = `select name
                            from profile
                            where month_point = ${maxPoint};`;
                
                pg.query(sql2, (err, rows) => {
                    if (err) throw err;
                    if (rows) {
                        responseData.result = 1;
                        responseData.monthUsers = rows.rows;
                    } else {
                        responseData.result = 0;
                    }
                    res.status(200).json(responseData);
                });
            }
        } else {
            responseData.result = 0;
            res.status(200).json(responseData);
        }
    });
});


module.exports = router;