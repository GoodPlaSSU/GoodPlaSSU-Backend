const express = require('express');
const router = express.Router();
const pg = require('../db/index');
const cloudinary = require('cloudinary').v2;


// 게시판의 한 페이지에 해당하는 게시물 조회 API
// request: tag, cursor (query string)
router.get('/', (req,res) => {
    var origin = req.getHeader("origin");
    if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    var responseData = {};
    const tag = req.query.tag;
    const cursor = req.query.cursor; // 직전에 받았던 게시물의 cursor

    // cursor 기반 페이지네이션
    // 클라이언트가 가져간 마지막 row의 순서상 다음 row들을 10개 요청/응답하게 구현
    // 기준: cursor
    // cursor: created_at(14자) + id(10자) --> 24자 string
    // 가장 최근 게시물 10개를 받고 싶다면 cursor를 '999999999999999999999999'를 보내주면 됨.(9가 24개)
    // cursor가 클수록 최근 게시물
    // 직전에 받았던 게시물의 cursor보다 작은 cursor를 가지는 게시물들은 좀 더 오래된 게시물들
    const sql = `select id, user_key, writer_name, writer_portrait, content, image1, image2, image3, image4, view_count, cheer_count, updated_at, (to_char(created_at, 'YYYYMMDDHH24MISS') || lpad(id::text, 10, '0')) as cursor
                from board
                where tag = ${tag} and (to_char(created_at, 'YYYYMMDDHH24MISS') || lpad(id::text, 10, '0')) < '${cursor}'
                order by cursor desc
                limit 10;`;

    pg.query(sql, (err, rows) => {
        if (err) throw err;
        if (rows) {
            responseData.result = rows.rowCount;
            responseData.post = rows.rows;
        } else {
            responseData.result = 0;
        }
        res.status(200).json(responseData);
    });   
});


// 요청 받은 ID의 게시물 조회 API (게시물 상세 조회 API)
// request: id (parameter values)
router.get('/:id', (req, res) => {
    var origin = req.getHeader("origin");
    if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    var responseData = {};
    const id = req.params.id;

    const sql1 = `update board 
                set view_count = view_count + 1 
                where id = ${id};`; // 조회수 증가 쿼리
    const sql2 = `select user_key, writer_name, writer_portrait, content, image1, image2, image3, image4, view_count, cheer_count, updated_at 
                from board 
                where id = ${id};`;

    pg.query(sql1+sql2, (err, rows) => {
        if (err) throw err;
        if (rows) {
            responseData.result = 1;
            responseData.post = rows[1].rows;

            const sql3 = `update profile
                        set total_point = total_point + 1, month_point = month_point + 1
                        where id = '${rows[1].rows[0].user_key}';`; // 작성자 선행 포인트 증가 쿼리
            
            pg.query(sql3, (err) => {
                if (err) throw err;
            });

        } else {
            responseData.result = 0;
        }
        res.status(200).json(responseData);
    });
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


// 게시물 생성 API
// request: user_key, content, image1, image2, image3, image4, tag (json)
// request로 받은 내용과 작성자 이름과 프로필 사진까지 함께 저장
router.options('/', async(req,res) => {
    var origin = req.getHeader("origin");
    if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.sendStatus(200);
    
    router.post('/', async(req, res) => {
        var origin = req.getHeader("origin");
        if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        const sql1 = `select name, portrait 
                    from profile 
                    where id = '${req.body.user_key}';`; // 작성자 이름, 프로필 사진 가져오는 쿼리
        const sql2 = `update profile
                    set total_point = total_point + 1, month_point = month_point + 1
                    where id = '${req.body.user_key}';`; // 작성자 선행 포인트 증가 쿼리

        // image가 4개까지 들어올 수 있어서 각각 변수로 만들지 않고 리스트로 만듦.
        // 만약 image1이 null이 아니면(이미지 파일이 들어왔으면),
        // cloudinary에 이미지를 업로드하고 업로드 된 그 이미지의 secure_url을 받아옴.
        var imageUrls = {};
        if (req.body.image1)
            imageUrls.image1 = await getImageUrl(req.body.image1);
        if (req.body.image2)
            imageUrls.image2 = await getImageUrl(req.body.image2);
        if (req.body.image3)
            imageUrls.image3 = await getImageUrl(req.body.image3);
        if (req.body.image4)
            imageUrls.image4 = await getImageUrl(req.body.image4);

        pg.query(sql1+sql2, (err, rows) => {
            if (err) throw err;

            const sql3 = `insert into board (user_key, content, image1, image2, image3, image4, tag, writer_name, writer_portrait) 
                        values ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
            const dbInput = [req.body.user_key, req.body.content, imageUrls.image1, imageUrls.image2, imageUrls.image3, imageUrls.image4, req.body.tag, rows[0].rows[0].name, rows[0].rows[0].portrait];

            pg.query(sql3, dbInput, (err) => {
                if (err) throw err;
                res.sendStatus(201);
            });
        });
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
// request: content, image1, image2, image3, image4 (json)
// 수정 안된 값도 그대로 json 파일에 포함시켜 꼭 보내주기!
// 안보내주면 자동으로 null 값으로 들어감.
router.post('/:id', async(req, res) => {
    var origin = req.getHeader("origin");
    if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    const id = req.params.id;

    const sql = `update board 
                set content = $1, image1 = $2, image2 = $3, image3 = $4, image4 = $5, updated_at = NOW() 
                where id = ${id};`;

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

    // 수정된 이미지만 cloudinary에 업로드하고 그 url 받아서 디비에 넣어줌.
    var imageUrls = {};
    if (req.body.image1)
        imageUrls.image1 = await getImageUrl(req.body.image1);
    if (req.body.image2)
        imageUrls.image2 = await getImageUrl(req.body.image2);
    if (req.body.image3)
        imageUrls.image3 = await getImageUrl(req.body.image3);
    if (req.body.image4)
        imageUrls.image4 = await getImageUrl(req.body.image4);

    const dbInput = [req.body.content, imageUrls.image1, imageUrls.image2, imageUrls.image3, imageUrls.image4];

    pg.query(sql, dbInput, (err) => {
        if (err) throw err;
        res.sendStatus(201);
    });
});


// 게시물 삭제 API
// request: id (parameter values)
router.delete('/:id', async(req, res) => {
    var origin = req.getHeader("origin");
    if (origin === "http://localhost:3000" || origin === "https://goodplassu.herokuapp.com") {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

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