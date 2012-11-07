// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file.
  deps: ["init"],

  paths: {
    // JavaScript folders.
    libs: "./vendor",
    plugins: "./plugins",

    // Libraries.
    FB:         "./vendor/fb",
    jquery:     "./vendor/jquery-1.8.1.min",
    underscore: "./vendor/underscore-min",
    backbone:   "./vendor/backbone-min",
    bootstrap:  "./vendor/bootstrap.min",
    qr:         "./vendor/qrcode",
    text:       "./vendor/require/text",
    html5WebCam:"./vendor/html5-webcam",
    swfobject:  "./vendor/swfobject",
    llqrcode:   "./vendor/qr_reader/llqrcode"
  },

  shim: {
    FB: {
      exports: "FB"
    },

    // Backbone library depends on underscore and jQuery.
    underscore: {
      exports: "_"
    },

    backbone: {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },

    bootstrap: {
      deps: ["jquery"],
      exports: "Bootstrap"
    },

    qr: {
      exports: "qrGenerator"
    },

    swfobject: {
      exports: "swfobject"
    },

    llqrcode: {
      exports: "qrcode"
    },

    "plugins/jquery.masonry.min": ["jquery"]
  }

});

// Start the application
require([
  "routers/router"
],

function(Router) {
  // Bootstrap main app here, if needed
  new Router();
  Backbone.history.start({
    pushState: true
  });
});
