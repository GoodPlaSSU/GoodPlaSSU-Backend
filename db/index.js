const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DB_URI,
    ssl: {
        rejectUnauthorized: false,
    }
});

client.connect(err => {
    if (err) console.log('err');
    else console.log('데이터베이스 연결 성공');
});