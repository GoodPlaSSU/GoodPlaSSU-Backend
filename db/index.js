const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DB_URI,
    ssl: {
        rejectUnauthorized: false,
    }
});

db.connect(err => {
    if (err) console.log('err');
    else console.log('데이터베이스 연결 성공');
});

module.exports = db;