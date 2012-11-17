define(function() {
  return {
    load: function(name, req, onLoad, config) {
      if (config.isBuild) {
        onLoad(null); 
      } else {
        window.fbAsyncInit = function() {
          FB.init({
            appId      : config.fb_app_id,
            channelUrl : '//'+window.location.hostname+'/channel.html',
            status     : true, // check login status
            cookie     : true, // enable cookies to allow the server to access the session
            xfbml      : false // don't parse XFBML
          });
          onLoad(FB);
        };

        // Load the SDK asynchronously
        (function(d){
          var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
          if (d.getElementById(id)) {return;}
          js = d.createElement('script'); js.id = id; js.async = false;
          js.src = "//connect.facebook.net/en_US/all.js";
          ref.parentNode.insertBefore(js, ref);
        }(document));
      }
    }
  };
});

