var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
var FCM = require('fcm-push');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var serverKey = "AAAALN0pKyQ:APA91bEgbmmi4_A9wvhpV0OwgNrzwx0lwSkKD7THTyZ-gmS8GBvXuE7lRodJaJpmlsb91s3OioYgB1GqxSNaL1pskyVtPn6v4XVwZlmZiPfTonMgATQjGFbx-IGOg-thGjDuyXPmXsj3";
var fcm = new FCM(serverKey);
var obj = {
  tokens: []
};



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT,GET,DELETE,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With,Content-Type, Accept, Authorization,' +
    ' Access-Control-Allow-Credential');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

var file_path = path.join(__dirname, '/public/tokenjsonfile.json');

app.post("/save_token", (request, response) => {
  var token = request.body.token;
  if (token == null || token == 'null') {
    response.status(401);
    return response.send({
      "statuscode": 401,
      "status": "error to save token with null"
    });
  }
  fs.exists(file_path, function (exists) {
    if (exists) {
      fs.readFile(file_path, function readFileCallback(err, data) {
        if (err) {
          console.log(err);
          response.status(401);
          return response.send({
            "statuscode": 401,
            "status": "error to read token from file"
          });
        } else {
          obj = JSON.parse(data);

          if (obj.tokens.indexOf(token) != -1) {
            response.status(401);
            return response.send({
              "statuscode": 401,
              "status": "error to save token, this token already exist in file"
            });
          } else {
            obj.tokens.push(token);
            var json = JSON.stringify(obj);
            fs.writeFile(file_path, json, 'utf8', function (e, r) {
              if (e) {
                response.status(401);
                return response.send({
                  "statuscode": 401,
                  "status": "error to write token in file"
                });
              }
              response.status(200);
              return response.send({
                "statuscode": 200,
                "status": "token successfully saved in file"
              });
            });
          }
        }
      });
    } else {
      obj.tokens = [];
      obj.tokens.push(token);
      var json = JSON.stringify(obj);
      fs.writeFile(file_path, json, 'utf8', function (e, r) {
        if (e) {
          console.log(e);
          response.status(401);
          return response.send({
            "statuscode": 401,
            "status": "error to write token in file"
          });
        }
        response.status(200);
        return response.send({
          "statuscode": 200,
          "status": "token successfully saved"
        });
      });
    }
  });
});


app.post("/notify", (request, response) => {
  fs.exists(file_path, function (exists) {
    if (exists) {
      fs.readFile(file_path, function readFileCallback(err, data) {
        if (err) {
          console.log(err);
        } else {
          obj = JSON.parse(data);
          console.log(obj);
          for (var i = 0; i < obj.tokens.length; i++) {
            sendNotification(i, response, obj.tokens[i]);
          }
        }
      });
    }
  });
});


function sendNotification(_i, response, _token) {
  var message = {
    to: _token,
    notification: {
      title: "RandR POC", //title of notification 
      body: "New product type published", //content of the notification
      sound: "default",
      icon: "ic_notification", //default notification icon
      show_in_foreground: true, //default notification icon
      priority: "high",
      id: "12345" //default notification icon
    },
    data: {
      testdata: "New product type published",
      title: "RandR POC", //title of notification 
      body: "New product type published", //content of the notification
      sound: "default",
      icon: "ic_notification", //default notification icon
      show_in_foreground: true, //default notification icon
      priority: "high",
      id: "12345" //default notification icon
    } //payload you want to send with your notification
  };
  fcm.send(message, function (err, res) {
    if (err) {
      console.log("Notification not sent " + err);
    } else {
      console.log("Successfully sent with response " + res);
    }
  });
}

var server = app.listen(3000, function () {
  console.log('Listening on port %s...' + server.address().port);
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
