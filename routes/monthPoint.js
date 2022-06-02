const express = require('express');
const router = express.Router();
const pg = require('../db/index');
const cors = require('cors');

const corsOptions = {
    origin: 'http://localhost:3000' || 'https://goodplassu.herokuapp.com',
    credentials : true,
    optionSuccessStatus: 200
}

// 이달의 선행왕 선정 API
// require: 없음.
// 유저가 없어서 maxPoint select 쿼리 결과가 없거나
// maxPoint가 선행 포인트 최솟값(10)보다 작은 경우 result = 0만 response
// 그 외에는 maxpoint 값을 가지고 있는 유저들의 name을 response
router.get('/', cors(corsOptions), async (req, res) => {
    // var origin = req.getHeader("origin");
    // if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
    //     res.setHeader('Access-Control-Allow-Origin', origin);
    // }
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
    var responseData = {};

    const sql1 = `select max(month_point) from profile;`; // 선행 포인트 최댓값 select 쿼리

    try {
        const rows1 = await pg.query(sql1);
        const maxPoint = rows1.rows[0].max; // month_point 최댓값

        if (rows1.rowCount == 0 || maxPoint < 10) { // 결과가 없거나 최솟값(10)보다 작은 경우
            responseData.result = 0;
        } else {
            const sql2 = `select name
                        from profile
                        where month_point = ${maxPoint};`; // 이달의 선행왕 name select 쿼리

            const rows2 = await pg.query(sql2);

            if (rows2) {
                responseData.result = rows2.rowCount; // 이달의 선행왕 유저 수
                responseData.maxPoint = maxPoint; // 이달의 선행왕의 선행 포인트
                responseData.monthUsers = rows2.rows; // 이달의 선행왕 유저들 name
            } else {
                responseData.result = 0;
            }
        }
        res.status(200).json(responseData);
    } catch (err) {
        throw err;
    }
});


module.exports = router;