/*
 * Copyright Tom Elliott
 *
 * NQP Server
 * This is the main backend in the NQP Demonstration Application. See the detailed
 * readme (README_DETAILED.md) for more information.
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
    async   = require('async'),
    dab     = require('./dabUtils.js');

var app = express.createServer();
var db  = new sqlite3.Database('./db/master.sqlite');

var FACEBOOK_SECRET = (config && config.app ? config.app.secret : process.env.FACEBOOK_SECRET);
var FACEBOOK_APP_ID = (config && config.app ? config.app.app_id : process.env.FACEBOOK_APP_ID);
if (!FACEBOOK_SECRET || !FACEBOOK_APP_ID) {
  throw "Could not find Facebook details"
}

app.configure(function() {
  app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
  app.use(express.bodyParser());
  app.use(express.cookieParser(SECRET));
  app.use(express.session({
    key: 'nqp',
    secret: SECRET
  }));

  app.set("view options", { layout: false });
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade')
  app.get('/', sendToBackbone);

  app.use(express.static(__dirname + '/public'));

  // #mark - APIs for the QR based booth

  /*
   * Generate a new Hash for the user. This API is called by the user client (i.e. their iPhone)
   *
   * Query params:
   * signed_request: A Facebook signed request (https://developers.facebook.com/docs/howtos/login/signed-request/) object
   */
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
      sendHashCode(err, encodedCode, res);
    });
  });

  /*
   * Retrieve an access token for the provided hash. This API is called by the Booth, presumably after a call
   * to /api/gen has been called by a client
   *
   * Query params:
   * code: The hash code whose associated access token we wish to retrieve
   */
  app.get('/api/get_access_token', function(req, res) {
    console.log("Received new API call to /api/get_access_token at " + new Date());

    var hash = req.query["code"];
    if (hash) {
      db.all("SELECT fbid AS fb_id, access_token AS token, access_token_expires AS expires FROM user WHERE hash = $hash AND access_token IS NOT NULL", {
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

  // #mark - APIs for the Device Auth based booth

  /*
   * This API checks the DB for the 'external UID' - a unique token from an external
   * system like a loyalty card scheme etc.
   *
   * If it finds the external UID in the DB, it checks the access token is still valid
   * and, if so, returns it. Otherwise it generates a new Device Auth code from Facebook
   * and returns that.
   *
   * Query params:
   * externalUID: The Unique ID in the 'external' system, i.e. your loyalty system
   */
  app.get('/api/get_access_token_or_device_auth_code', function(req, res) {
    console.log("Received new API call to /api/get_access_token_or_device_auth_code at " + new Date());

    var externalUID = req.query["externalUID"];
    var scope = "user_photos,publish_actions";
    var session = req.session;

    if (!session.user) {
      session.user = {};
    }

    if (externalUID) {
      // First, check to see if this externalUID is in our database, and associated with an access token
      // If so, check the access token is still valid
      // Finally, return access token (if valid), or go through device auth flow if not

      async.series({
        checkForExistingValidToken: function(cb) {
          async.waterfall([
            // Lookup results from db
            function(inner_callback) {
              db.all("SELECT fbid AS fb_id, access_token AS token FROM user WHERE external_uid = $externalUID", {
                $externalUID: externalUID
              }, inner_callback); 
            },
            // Check for data errors in db
            function(rows, inner_callback) {
              if (rows.length > 1) {
                inner_callback("Error retrieving external UID. DB Call returned " + rows.length + " rows");
              } else if (rows.length == 1 && rows[0].fb_id && rows[0].token) {
                // Pass token to getUserDetails
                inner_callback(null, rows[0].fb_id, rows[0].token);
              } else {
                // Details not found in database. Call outer (series) callback with error
                // Don't called the inner callback, we're done with this inner waterfall
                cb("User not found in database");
              }
            },
            function(fbid, access_token, inner_callback) {
              // The user was found in the DB. Check the access token still works
              // If the user lookup fails we want to hit the outer (series) callback,
              // not the inner (waterfall) one
              dab.getUserDetails(null, fbid, access_token, null, function(err) {
                if (err) cb(err);
                else inner_callback(null, access_token);
              });              
            }
          ],
          // Final callback for inner Waterfall flow
          function(err, access_token){
            if (err) {
              sendInternalServerError(res, err);
            } else {
              res.header('Content-Type', 'text/json');
              res.send(JSON.stringify({
                success: "true",
                data: {
                  access_token: access_token
                } 
              }));
            }
          });
        }
      // Final callback for outer Series flow
      }, function(err){
        if (err) {
          // Did not find a valid access token, so generate a device auth code
          dab.generateCode(FACEBOOK_APP_ID, scope, function(err, response) {
            if (err) {
              console.log(err);
              sendInternalServerError(res);
            } else {
              // Set external UID as key in session
              session.user.externalUID = externalUID;
              session.save();

              res.header('Content-Type', 'text/json');
              res.send(JSON.stringify({
                success: "true",
                data: response
              })); 
            }
          });
        }
      });      
    } else {
      sendInternalServerError(res);
    }
  });

  /*
   * This API requests the status of the Device Auth verification code from Facebook.
   * When the user has registered their code it returns the access token.
   *
   * Query params:
   * verificationCode: The verification code generated by Facebook's Device Auth system
   */
  app.get('/api/check_device_auth_status', function(req, res) {
    console.log("Received new API call to /api/check_device_auth_status at" + new Date());

    var verificationCode = req.query["verificationCode"];
    var session = req.session;

    if (verificationCode) {
      async.waterfall([
        function(cb){
          cb(null, FACEBOOK_APP_ID, verificationCode);
        },
        dab.pollFacebook,
        dab.getUserDetails,
        extendAccessToken
      ],
      function(err, response, fb_id, access_token) {
        if (err) {
          // Let the client handle errors, and Facebook sends error codes to indicate the user hasn't authed yet :(
          res.header('Content-Type', 'text/json');
          res.send(JSON.stringify({
            success: "false",
            message: err.error.message
          }));
        } else {
          // First, save access token in database
          if (session.user && session.user.externalUID) {
            var nullFunc = function(){};
            createOrUpdateUserRecord(fb_id, access_token, "", "", session.user.externalUID, nullFunc);
          }

          res.header('Content-Type', 'text/json');
          res.send(JSON.stringify({
            success: "true",
            data: response
          }));        
        }
      });
    } else {
      sendInternalServerError(res);
    }
  });

  // #mark - Additional APIs

  app.get('/api/logout', function(req, res) {
    req.session.destroy(function(err) {
      console.log("User logged out");

      if (err) sendInternalServerError();

      res.status(200);
      res.end();
    });
  });

  // #mark - Additional server configuration

  app.use(function(req, res, next){
    // Let backbone handle 404s and non-api paths
    res.header('Content-Type', 'text/html');
    sendToBackbone(req, res);
  });
});

app.configure('dev', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('prod', function(){
    app.use(express.errorHandler()); 
});

/*
 * Let the client code handle the request
 */
function sendToBackbone(req, res) {
  res.render('index', {
    fb_app_id       : FACEBOOK_APP_ID
  });
};

/*
 * Decode a Facebook signed request
 */
function decodeSignedRequest(signedRequest, callback) {
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

            callback(null, r, data.user_id, access_token, expires);
          });
        }
      }
    } else {
      callback("Could not find signed request in HTTP request", null);
    }
};

/*
 * Attempts to extend the Facebook access token 
 * (https://developers.facebook.com/docs/howtos/login/extending-tokens/)
 *
 * If the request fails, simply return the original token
 */
function extendAccessToken(response, fbId, accessToken, expires, callback) {
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
    callback(null, response, fbId, accessToken, expires);
  });

  request.on('success', function(r) {
    accessToken = qs.parse(r).access_token;
    expires = qs.parse(r).expires;

    callback(null, response, fbId, accessToken, expires);
  });
};

/*
 * Generate a hash code (as used in the QR booth) from the users FBID
 */
function generateHashCode(response, fbId, accessToken, expires, callback) {
  // Extract access token and generate our code
  var encodedCode = crypto.createHmac('SHA256', SECRET).update(fbId).digest('base64');

  callback(null, fbId, accessToken, expires, encodedCode, null);
};

/*
 * If the given user exists in the database, this method will update her records. Otherwise create a new user
 */
function createOrUpdateUserRecord(fb_id, access_token, access_token_expires, hash, externalUID, cb) {
  db.get("SELECT count(*) AS total FROM user WHERE fbid = $fb_id", {
    $fb_id: fb_id
  }, function(err, result) {
    if (result.total > 1) {
      // TODO: Handler error
      cb(false);
    } else if (result.total == 0) {
      // Create a new row
      console.log('Creating new row in Database for user ' + fb_id);
      db.run("INSERT INTO user (fbid, access_token, access_token_expires, hash, external_uid) VALUES ($fb_id, $access_token, $access_token_expires, $hash, $externalUID)", {
        $fb_id: fb_id,
        $access_token: access_token,
        $access_token_expires: access_token_expires,
        $hash: hash,
        $externalUID: externalUID
      }, function(err) {
        if (err) cb("Error saving to database");
        else cb(null, hash, externalUID);
      });
    } else {
      // Update row
      console.log('Updating user ' + fb_id + ' in Database');
      db.run("UPDATE user SET fbid = $fb_id, access_token = $access_token, access_token_expires = $access_token_expires, hash = $hash, external_uid = $externalUID WHERE fbid = $fb_id", {
        $fb_id: fb_id,
        $access_token: access_token,
        $access_token_expires: access_token_expires,
        $hash: hash,
        $externalUID: externalUID
      }, function(err) {
        if (err) cb("Error saving to database");
        else cb(null, hash, externalUID);
      })
    }
  });
};

/*
 * Sends the hash code in the response
 */
function sendHashCode(err, encodedCode, res) {
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

// #mark - Internal Helper Methods

function sendBadRequest(res, message, statuscode) {
  sendError(res, message, statuscode || 400);
}

function sendInternalServerError(res, message) {
  sendError(res, message, 500);
};

function sendError(res, message, statuscode) {
  res.header('Content-Type', 'text/json');
  res.status(statuscode);

  response = {'success': false};
  if (message) {
    response.message = message;
  }

  res.write(JSON.stringify(response));
}

// #mark - Start the server

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
