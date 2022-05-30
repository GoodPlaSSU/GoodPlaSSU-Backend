var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cloudinary = require('cloudinary').v2;
var cors = require('cors');

var indexRouter = require('./routes/index');
var boardRouter = require('./routes/board');
var commentRouter = require('./routes/comment');
var mypageRouter = require('./routes/mypage');
var adRouter = require('./routes/ad');
var cheerRouter = require('./routes/cheer');
var monthPointRouter = require('./routes/monthPoint');
var loginRouter = require('./routes/login');

var app = express();

// db connection
const db = require('./db/index');
db.connect(err => {
	if (err) console.log('데이터베이스 연결 실패');
	else console.log('데이터베이스 연결 성공');
});

// cloudinary connection
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/board', boardRouter);
app.use('/comment', commentRouter);
app.use('/mypage', mypageRouter);
app.use('/ad', adRouter);
app.use('/cheer', cheerRouter);
app.use('/monthPoint', monthPointRouter);
app.use('/login', loginRouter);

// CORS setting
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "POST, GET, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
