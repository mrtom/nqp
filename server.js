/*
 * Copyright Tom Elliott
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var SECRET = "fcda08e9fa30627468a998425ec6a988";

var express = require('express'),
    uuid    = require('node-uuid'),
    config  = require('./config'),
    crypto  = require('crypto'),
    restler = require('restler'),
    qs      = require('querystring'),
    sqlite3 = require('sqlite3'),
    async   = require('async');

var app = express.createServer();
var db  = new sqlite3.Database('./db/master.sqlite');

var FACEBOOK_SECRET = (config && config.app ? config.app.secret : process.env.FACEBOOK_SECRET);
var FACEBOOK_APP_ID = (config && config.app ? config.app.app_id : process.env.FACEBOOK_APP_ID);
if (!FACEBOOK_SECRET || !FACEBOOK_APP_ID) {
  throw "Could not find Facebook details"
}

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.cookieParser());

  app.set("view options", { layout: false });
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade')
  app.get('/', function(req, res){
    res.render('index', {fb_app_id:FACEBOOK_APP_ID});
  });

  app.use(express.static(__dirname + '/public'));
  
  app.post('/api/gen', function(req, res) {
    console.log("Received new API call to /api/gen at " + new Date());
    var signedRequest = req.param('signed_request');

    async.waterfall([
      function(cb){
        cb(null, signedRequest);
      },
      decodeSignedRequest,
      extendAccessToken,
      generateHashCode,
      createOrUpdateUserRecord
    ],
    function(err, encodedCode) {
      sendAccessToken(err, encodedCode, res);
    });
  });

  app.get('/api/get_access_token', function(req, res) {
    console.log("Received new API call to /api/get_access_token at " + new Date());

    var hash = req.query["code"];
    if (hash) {
      db.all("SELECT fbid AS fb_id, access_token AS token, access_token_expires AS expires FROM user WHERE hash = $hash", {
        $hash: hash
      }, function(err, rows) {
        if (err || rows.length > 1) {
          console.log("Error retrieving access token.");
          if (rows) {
            console.log("DB Call returned " + rows.length + " rows");
          }
          if (err) {
            console.log(err);
          }
          sendInternalServerError(res);
        } else {
          res.header('Content-Type', 'text/json');
          if (rows.length == 0) {
            res.send(JSON.stringify({
              'success': true
            }));
          } else {
            // Sanity check
            var fb_id = rows[0].fb_id;
            var encoded_fb_id = crypto.createHmac('SHA256', SECRET).update(fb_id).digest('base64');

            if (encoded_fb_id !== hash) {
              res.sendInternalServerError(res);
              return;
            }

            res.send(JSON.stringify({
              'success': true,
              'access_token': rows[0].token,
              'expires': rows[0].expires
            }));
          }
        }
      });
    } else {
      sendInternalServerError(res);
    }
  });

  app.use(function(req, res, next){
    // Let backbone handle 404s
    res.header('Content-Type', 'text/html');
    res.render('index', {fb_app_id:FACEBOOK_APP_ID});
  });
});

app.configure('dev', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('prod', function(){
    app.use(express.errorHandler()); 
});

function decodeSignedRequest(signedRequest, callback) {
    // Decode signed Request
    if (signedRequest) {
      var index = signedRequest.indexOf(".");
      if (index > 0) {
        var encodedSig = signedRequest.substr(0, index);
        var payload = signedRequest.substr(index+1);

        var data = JSON.parse(new Buffer(payload, 'base64').toString('ascii'));
        if (data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
          // TODO: Handle error, log etc
        }

        var hashedSig = crypto.createHmac('SHA256', FACEBOOK_SECRET).update(payload).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace('=','');

        var decodedSig = new Buffer(encodedSig, 'base64').toString('ascii');
        var decodedHashedSig = new Buffer(hashedSig, 'base64').toString('ascii');
        if (!decodedSig === decodedHashedSig) {
          // TODO: Handler error, log etc
          console.log("*** WARNING!: Couldn't verify signed request! ***")
        }

        // Get access token
        var access_token;
        var expires;
        var userId = data.user_id;

        if (data.oauth_token) {
          access_token = data.oauth_token;
          expires = data.expires;

          callback(null, data.user_id, access_token, expires);
        } else {
          if (!data.code) {
            console.log("*** WARNING!: No ouath token and no code to get one. :( ***");
          }

          var params = {
            client_id:     config.app.app_id,
            client_secret: FACEBOOK_SECRET,
            redirect_uri:  '',
            code:          data.code
          };

          var request = restler.get('https://graph.facebook.com/oauth/access_token', { query:params });
          
          request.on('fail', function(data) {
            var result = JSON.parse(data);
            callback('Invalid code: ' + result.error.message);
          });

          request.on('success', function(r) {
            access_token = qs.parse(r).access_token;
            expires = qs.parse(r).expires;

            callback(null, data.user_id, access_token, expires);
          });
        }
      }
    } else {
      callback("Could not find signed request in HTTP request", null);
    }
};

function extendAccessToken(fbId, accessToken, expires, callback) {
  var params = {
    client_id         : config.app.app_id,
    client_secret     : FACEBOOK_SECRET,
    grant_type        : 'fb_exchange_token',
    fb_exchange_token : accessToken
  };
  var request = restler.get('https://graph.facebook.com/oauth/access_token', { query:params });

  request.on('fail', function(data) {
    var result = JSON.parse(data);
    console.log("Could not extend access token. Continuing with original");
    callback(null, fbId, accessToken, expires);
  });

  request.on('success', function(r) {
    accessToken = qs.parse(r).access_token;
    expires = qs.parse(r).expires;

    callback(null, fbId, accessToken, expires);
  });
};

function generateHashCode(fbId, accessToken, expires, callback) {
  // Extract access token and generate our code
  var encodedCode = crypto.createHmac('SHA256', SECRET).update(fbId).digest('base64');

  callback(null, fbId, accessToken, expires, encodedCode);
};

function createOrUpdateUserRecord(fb_id, access_token, access_token_expires, hash, cb) {
  db.get("SELECT count(*) AS total FROM user WHERE fbid = $fb_id", {
    $fb_id: fb_id
  }, function(err, result) {
    if (result.total > 1) {
      // TODO: Handler error
      cb(false);
    } else if (result.total == 0) {
      // Create a new row
      console.log('Creating new row in Database for user ' + fb_id);
      db.run("INSERT INTO user (fbid, access_token, access_token_expires, hash) VALUES ($fb_id, $access_token, $access_token_expires, $hash)", {
        $fb_id: fb_id,
        $access_token: access_token,
        $access_token_expires: access_token_expires,
        $hash: hash
      }, function(err) {
        if (err) cb("Error saving to database");
        else cb(null, hash);
      });
    } else {
      // Update row
      console.log('Updating user ' + fb_id + ' in Database');
      db.run("UPDATE user SET fbid = $fb_id, access_token = $access_token, access_token_expires = $access_token_expires, hash = $hash WHERE fbid = $fb_id", {
        $fb_id: fb_id,
        $access_token: access_token,
        $access_token_expires: access_token_expires,
        $hash: hash
      }, function(err) {
        if (err) cb("Error saving to database");
        else cb(null, hash);
      })
    }
  });
};

function sendAccessToken(err, encodedCode, res) {
  if (err) {
    console.log(err);
    sendInternalServerError(res);
  } else {
    res.header('Content-Type', 'text/json');
    res.send(JSON.stringify({
      'success': true,
      'code': encodedCode
    }));
  }
};

function sendInternalServerError(res) {
  res.header('Content-Type', 'text/json');
  res.status(500);
  res.write(JSON.stringify({'success': false}));
};

// sigh no ipv6
// Do some shuffling for heroku vs localhost
var port, domain;
port = process.env.PORT;
if (process.env.PORT) {
  // Heroku!
  domain = "0.0.0.0";
} else {
  domain = config.app.host;
  port   = config.app.port;
}

var server = app.listen(port, domain, null, function() {
  console.log("Started server on port http://%s:%d", server.address().address, server.address().port);
});
