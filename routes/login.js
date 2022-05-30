require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

// 구글 로그인 연동 API
// require: idToken
// 구글에 idToken이 유효한지 체크
// 유효: 구글에서 validate 응답 --> sendStatus(200)
// 1. 로그인 유저가 이미 DB에 있음 --> token만 업데이트
// 2. 로그인 유저가 DB에 없음 --> DB에 유저 저장 / 새로 토큰을 만들어주고 돌려줌.
router.post('/', (req, res) => {
    const idToken = req.body.idToken;

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    async function verify() {
        const ticket = await client.verifyIdToken(idToken);
        const payload = ticket.getPayload();
        const id = payload.sub; // 21자리의 Google 회원 id 번호 --> DB에 사용자 id로 넣기

        //const sql = `select token from profile where id = ${id};`;
        const sql = `select token from profile where sub = ${id};`;

        pg.query(sql, (err, rows) => {
            var token = '';

            if (err) throw err;
            if (rows.rowCount > 0) { // DB에 있는 사용자
                //token = updateToken(payload);
            } else { // DB에 없는 사용자
                //token = insertUserIntoDB(payload);
                insertUserIntoDB(payload);
            }
            //res.status(200).send(token);
            res.sendStatus(200);
        });
    }
    verify().then(() => {}).catch(console.error);
});


// 1. DB에 있는 사용자 token 업데이트
const updateToken = (payload) => {
    const {
        sub,
        name,
        picture
    } = payload;

    // jwt token 생성
//    const token = jwt.sign({
//        id: sub,
//        name: name,
//        portrait: picture
//        },
//        JWT_SECRET
//    );

    // DB의 token 업데이트
    //const sql = `update profile set token = ${token} where id = ${sub};`;
    const sql = `update profile set token = ${token} where sub = ${sub};`;

    pg.query(sql, (err) => {
        if (err) throw err;
    });

    //return token;
}


// 2. DB에 없는 사용자 DB에 insert 및 토큰 생성
const insertUserIntoDB = (payload) => {
    const {
        sub,
        name,
        picture
    } = payload;

    // jwt token 생성
//    const token = jwt.sign({
//        id: sub,
//        name: name,
//        portrait: picture
//        },
//        JWT_SECRET
//    );

    // DB에 새 사용자 insert
    //const sql = `insert into profile (id, name, portrait, token) 
    //            values (${sub}, ${name}, ${picture}, ${token});`;
    const sql = `insert into profile (sub, name, portrait) 
                values (${sub}, ${name}, ${picture});`;
    
    pg.query(sql, (err) => {
        if (err) throw err;
    });

    //return token;
}


module.exports = router;