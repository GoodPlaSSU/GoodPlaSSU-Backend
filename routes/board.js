const express = require('express');
const router = express.Router();
const pg = require('../db/index');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();


// cors 옵션 설정
const corsOptions = {
    origin: ["http://localhost:3000", "https://localhost:3000", "https://goodplassu.netlify.app/"],
    credentials : true,
    methods : 'GET,POST,DELETE,OPTIONS',
    optionSuccessStatus: 200
}


// 게시물 생성 API - cors preflight 처리 라우터
router.options('/', cors(corsOptions), async(req, res) => {
    res.sendStatus(200);
 });

 // 이미지 업로드 API - cors preflight 처리 라우터
router.options('/image/:id', cors(corsOptions), async(req, res) => {
    res.sendStatus(200);
 });

 // 게시물 수정, 삭제 API - cors preflight 처리 라우터
router.options('/:id', cors(corsOptions), async(req, res) => {
    res.sendStatus(200);
 });


// 게시판의 한 페이지에 해당하는 게시물 조회 API
// request: user_key, tag, cursor (query string)
router.get('/', cors(corsOptions), async(req,res) => {
    var responseData = {};
    const user_key = req.query.user_key;
    const tag = req.query.tag;
    const cursor = req.query.cursor; // 직전에 받았던 게시물의 cursor

    try {
        // cursor 기반 페이지네이션
        // 클라이언트가 가져간 마지막 row의 순서상 다음 row들을 10개 요청/응답하게 구현
        // 기준: cursor
        // cursor: created_at(14자) + id(10자) --> 24자 string
        // 가장 최근 게시물 10개를 받고 싶다면 cursor를 '999999999999999999999999'를 보내주면 됨.(9가 24개)
        // cursor가 클수록 최근 게시물
        // 직전에 받았던 게시물의 cursor보다 작은 cursor를 가지는 게시물들은 좀 더 오래된 게시물들
        const sql1 = `select id, user_key, content, image1, image2, image3, image4, view_count, cheer_count, updated_at, (to_char(created_at, 'YYYYMMDDHH24MISS') || lpad(id::text, 10, '0')) as cursor
                    from board
                    where tag = ${tag} and (to_char(created_at, 'YYYYMMDDHH24MISS') || lpad(id::text, 10, '0')) < '${cursor}'
                    order by cursor desc
                    limit 10;`; // 게시글 조회 쿼리
        const sql2 = `select name, portrait
                    from profile
                    where id = $1;`; // 작성자 정보 조회 쿼리
        const sql3 = `select is_on
                    from cheer
                    where user_key = '${user_key}' and board_key = $1;`; // 로그인 유저 좋아요 누름 확인 쿼리

        const boardRes = await pg.query(sql1); // 최근 게시물 최대 10개 가져오기
        if (boardRes.rowCount != 0) {
            responseData.result = boardRes.rowCount;
            responseData.post = boardRes.rows;
        } else {
            responseData.result = 0;
        }
        
        for (var i = 0; i < boardRes.rowCount; i++) {
            var profileRes = await pg.query(sql2, [boardRes.rows[i]['user_key']]); // 작성자 이름, 프로필 사진 가져오기
            if (profileRes.rowCount != 0) {
                responseData.writer_result = 1;
                responseData.post[i].writer_name = profileRes.rows[0]['name'];
                responseData.post[i].writer_portrait = profileRes.rows[0]['portrait'];
            } else {
                responseData.writer_result = 0;
            }

            var cheerRes = await pg.query(sql3, [boardRes.rows[i]['id']]); // 로그인 유저의 좋아요 누름 여부 확인하기
            if (cheerRes.rowCount != 0) { // 좋아요 추가/취소 기록 있으면 해당 기록 response
                responseData.post[i].is_on = cheerRes.rows[0]['is_on'];
            } else { // 좋아요 추가/취소 기록 없으면 좋아요 추가X이므로 false response
                responseData.post[i].is_on = false;
            }
        }

        res.status(200).json(responseData);

    } catch (err) {
        throw err;
    }
});


// 요청 받은 ID의 게시물 조회 API (게시물 상세 조회 API)
// request: id (parameter values)
router.get('/:id', cors(corsOptions), async(req, res) => {
    var responseData = {};
    const id = req.params.id;

    try {
        const sql1 = `update board 
                    set view_count = view_count + 1 
                    where id = ${id};`; // 조회수 증가 쿼리
        const sql2 = `select user_key, content, image1, image2, image3, image4, view_count, cheer_count, updated_at 
                    from board 
                    where id = ${id};`; // 게시물 조회 쿼리
        const sql3 = `select name, portrait
                    from profile
                    where id = $1;`; // 작성자 정보 조회 쿼리
        const sql4 = `update profile
                    set total_point = total_point + 1, month_point = month_point + 1
                    where id = $1;`; // 작성자 선행 포인트 증가 쿼리
        
        await pg.query(sql1); // 조회수 증가

        var boardRes = await pg.query(sql2); // 게시물 조회
        if (boardRes.rowCount != 0) {
            responseData.result = 1;
            responseData.post = boardRes.rows;
        } else {
            responseData.result = 0;
        }

        var profileRes = await pg.query(sql3, [boardRes.rows[0]['user_key']]); // 작성자 이름, 프로필 사진 조회
        if (profileRes.rowCount != 0) {
            responseData.writer_result = 1;
            responseData.post[0]['writer_name'] = profileRes.rows[0]['name'];
            responseData.post[0]['wirter_portrait'] = profileRes.rows[0]['portrait'];
        } else {
            responseData.writer_result = 0;
        }

        await pg.query(sql4, [boardRes.rows[0]['user_key']]); // 작성자 선행 포인트 증가

        res.status(200).json(responseData);

    } catch (err) {
        throw err;
    }
});


// Cloudinary 서버에 있는 이미지의 secure_url(https)을 받아오는 함수
// callback 함수에서 리턴값을 받아올 수 없어서 이렇게 처리해서 리턴값을 받아야 함
getImageUrl = (image) => {
    return new Promise((resolve, reject) => {
        // cloudinary에 이미지를 업로드
        cloudinary.uploader.upload(image, (err, res) => {
            if (err) reject(err);
            // 업로드한 이미지의 secure_url을 리턴하게 함
            resolve(res.secure_url);
        })
    })
}


// 게시물 생성 API - 내용 받아서 Create
// request: user_key, content, tag (json)
// response: id (json)
// request로 받은 내용과 작성자 이름과 프로필 사진까지 함께 저장    
router.post('/', cors(corsOptions), (req, res) => {
    var responseData = {};

    const sql1 = `update profile
                set total_point = total_point + 1, month_point = month_point + 1
                where id = '${req.body.user_key}';`; // 작성자 선행 포인트 증가 쿼리

    pg.query(sql1, (err, rows) => {
        if (err) throw err;

        const sql2 = `insert into board (user_key, content, tag) 
                    values ($1, $2, $3) returning id;`;
        const dbInput = [req.body.user_key, req.body.content, req.body.tag];

        pg.query(sql2, dbInput, (err, rows) => {
            if (err) throw err;
            if (rows.rowCount != 0) {
                responseData.result = rows.rowCount;
                responseData.id = rows.rows[0]['id'];
            } else {
                responseData.result = 0;
            }
            res.status(201).json(responseData);
        });
    });
});


// 이미지 업로드 API
// request: image1, image2, image3, image4 (form-data)
router.post('/image/:id', multipartMiddleware, cors(corsOptions), async(req, res) => {
    const id = req.params.id;

    // image가 4개까지 들어올 수 있어서 각각 변수로 만들지 않고 리스트로 만듦.
    // 만약 image1이 null이 아니면(이미지 파일이 들어왔으면),
    // cloudinary에 이미지를 업로드하고 업로드 된 그 이미지의 secure_url을 받아옴.
    var imageUrls = {};
    if (req.files.image1)
        imageUrls.image1 = await getImageUrl(req.files.image1.path);
    if (req.files.image2)
        imageUrls.image2 = await getImageUrl(req.files.image2.path);
    if (req.files.image3)
        imageUrls.image3 = await getImageUrl(req.files.image3.path);
    if (req.files.image4)
        imageUrls.image4 = await getImageUrl(req.files.image4.path);

    const sql = `update board set
                image1 = $1, image2 = $2, image3 = $3, image4 = $4
                where id = ${id};`;
    const dbInput = [imageUrls.image1, imageUrls.image2, imageUrls.image3, imageUrls.image4];

    pg.query(sql, dbInput, (err) => {
        if (err) throw err;
        res.sendStatus(201);
    });

});


// 수정 및 삭제할 때 필요. Cloudinary 서버에 있는 이미지를 지우기 위함.
// board 테이블에 있는 url 가져와서 리턴함
getDelImageUrl = (sql, index) => {
    return new Promise((resolve, reject) => {
        pg.query(sql, (err, res) => {
            if (err) reject(err);
            if (index == 1)
                resolve(res.rows[0].image1);
            else if (index == 2)
                resolve(res.rows[0].image2);
            else if (index == 3)
                resolve(res.rows[0].image3);
            else
                resolve(res.rows[0].image4);
        })
    })
}


// 게시물 수정 API
// request: content (json)
// 수정 안된 값도 그대로 json 파일에 포함시켜 꼭 보내주기!
// 안보내주면 자동으로 null 값으로 들어감.
router.post('/:id', multipartMiddleware, cors(corsOptions), async(req, res) => {
    var responseData = {};
    const id = req.params.id;

    const sql = `update board 
                set content = $1, updated_at = NOW() 
                where id = ${id};`;

    pg.query(sql, [req.body.content], (err) => {
        if (err) throw err;
        responseData.result = 1;
        responseData.id = id;
        res.status(201).json(responseData);
    });
});


// 게시물 삭제 API
// request: id (parameter values)
router.delete('/:id', cors(corsOptions), async(req, res) => {
    const id = req.params.id;

    const sql = `delete from board where id = ${id};`;

    // 기존에 cloudinary 서버에 올라가있는 이미지도 지우기 위한 부분.
    var i;
    for (i = 1; i <= 4; i++) {
        const delImgSql = `select image${i} from board where id = ${id};`;
        var delImgUrl = await getDelImageUrl(delImgSql, i);
        if (delImgUrl) {
            const public_id = delImgUrl.split("/").pop().split(".")[0];
            cloudinary.uploader.destroy(public_id, (err) => {
                if (err) throw err;
            })
        }
    }

    pg.query(sql, (err) => {
        if (err) throw err;
        res.sendStatus(204);
    });
});


module.exports = router;