const express = require('express');
const router = express.Router();
const pg = require('../db/index');

// POST로 받아오는 정보 : email(id), name, portrait
// profile 테이블에서 email이 pk인 row 있는지 확인하고
// 있으면 name과 portrait가 이전과 동일한지 확인해서 다르면 수정함
// 없으면 테이블에 추가함
router.post('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    const sql1 = `select id, name, portrait from profile where id='${req.body.id}'`;
    const sql2 = `insert into profile (id, name, portrait) values ($1, $2, $3)`;

    pg.query(sql1, (err, rows) => {
        if (err) throw err;
        if (rows.rowCount) {    // 기존 유저
            if (rows.rows.name !== req.body.name) { // 이름이 변경된 경우
                const sqlName = `update profile set name='${req.body.name}' where id='${req.body.id}'`;
                pg.query(sqlName, (err, rows) => {
                    if (err) throw err;
                });
            }
            if (rows.rows.portrait !== req.body.portrait) { // 프로필 이미지가 변경된 경우
                const sqlPortrait = `update profile set portrait='${req.body.portrait}' where id='${req.body.id}'`;
                pg.query(sqlPortrait, (err, rows) => {
                    if (err) throw err;
                });
            }
            res.sendStatus(201);
        } else {    // 신규 유저
            pg.query(sql2, [req.body.id, req.body.name, req.body.portrait], (err, rows) => {
                if (err) throw err;
                res.sendStatus(201);
            });
        }
    });
})

module.exports = router;