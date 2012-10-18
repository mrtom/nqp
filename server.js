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
    uuid = require('node-uuid'),
    config = require('./config'),
    crypto = require('crypto');

var app = express.createServer();

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  
  app.post('/api/gen', function(req, res) {

    // Decode signed Request
    var signedRequest = req.param('signed_request');
    if (signedRequest) {
      var index = signedRequest.indexOf(".");
      if (index > 0) {
        var encodedSig = signedRequest.substr(0, index);
        var payload = signedRequest.substr(index+1);

        // Do some substitutions
        payload = payload.replace("-", "+");
        payload = payload.replace("_", "/");

        var data = JSON.parse(new Buffer(payload, 'base64').toString('ascii'));

        if (data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
          // TODO: Handle error, log etc
        }

        var hashedSig = crypto.createHmac('SHA256', config.app.secret).update(payload).digest('base64');

        var decodedSig = new Buffer(encodedSig, 'base64').toString('ascii');
        var decodedHashedSig = new Buffer(hashedSig, 'base64').toString('ascii');
        if (!decodedSig === decodedHashedSig) {
          // TODO: Handler error, log etc
          console.log("*** WARNING!: Couldn't verify signed request! ***")
        }

        // Extract access token and generate our code
        var encodedCode = crypto.createHmac('SHA256', SECRET).update(data.user_id).digest('base64');

        // TODO:
        // Save user_id into database along with access token

        res.header('Content-Type', 'text/json');
        res.send(JSON.stringify({
          'success': true,
          'code': encodedCode
        }));
        return;
      }
    }

    // TODO: Handle error more gracefully
    res.header('Content-Type', 'text/json');
    res.write(JSON.stringify({'success': false}));
  });

  app.use(function(req, res, next){
    // Let backbone handle 404s
    res.header('Content-Type', 'text/html');
    res.sendfile('public/index.html');
  });
});

// sigh no ipv6
var port = process.env.PORT || 5000;
var server = app.listen(port, '127.0.0.1', null, function() {
  console.log("Started server on port http://%s:%d", server.address().address, server.address().port);
});
