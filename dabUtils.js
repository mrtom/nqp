var restler = require('restler');

(function() {
  var dab = {
    generateCode: function(client_id, scope, callback) {
      var data = {
        type:          "device_code",
        client_id:     client_id,
        scope:         scope
      };

      var request = restler.post('https://graph.facebook.com/oauth/device', { data:data });
      
      request.on('fail', function(data) {
        var result = JSON.parse(data);
        callback('Invalid code: ' + result.error.message);
      });

      request.on('success', function(r) {
        callback(null, r);
      });
    },

    pollFacebook: function(client_id, verificaiton_code, callback) {
      var data = {
        type:               "device_token",
        client_id:          client_id,
        code:  verificaiton_code
      };

      var request = restler.post('https://graph.facebook.com/oauth/device', { data:data });
      
      request.on('fail', function(data) {
        // Facebook returns a 400 when the user hasn't done
        // their thing yet, so they're not errors necessarily :(
        var result = JSON.parse(data);
        callback(result);
      });

      request.on('success', function(r) {
        callback(null, r);
      });
    }
  }

  module.exports = dab;
}());