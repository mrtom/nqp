define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",
  "swfobject",
  "llqrcode",

  // Models
  "models/booth",

  // Views
  "views/base",

  // Templates
  "text!template/boothNoUserTemplate.html",
  "text!template/boothWithUserTemplate.html"
],

// Loads the booth
function($, _, Backbone, Bootstrap, swfobject, llqrcode, Booth, BaseView, boothNoUserTemplate, boothWithUserTemplate) {
  var BoothView = BaseView.extend({

    boothNoUserTemplate: _.template(boothNoUserTemplate),
    boothWithUserTemplate: _.template(boothWithUserTemplate),

    gCtx: null,
    gCanvas: null,
    gUM: false,
    imageData: null,
    webkit: false,
    video: null,
    c: null,

    initialize: function() {
      // Load appwide defaults
      // Turn on bootstrap data-api
      $('body').on('.data-api');

      // Load QR support
      if (!this.isCanvasSupported()) {
        var errorStr = "This demo requires canvas! Aborting...";
        console.error(errorStr);
        alert(errorStr);

        return;
      } 
      
      $('#bootstrap').append(this.$el);
      this.render();
    },

    render: function() {
      var user = this.model.get('user')

      if (user) {
        $(this.el).html(this.boothWithUserTemplate(this.model.toJSON()));
      } else {
        $(this.el).html(this.boothNoUserTemplate());
        this.initCanvas();
        qrcode.callback = _.bind(this.handleRead, this);

        this.initQR();
        // Start polling for QR codes. Add timeout to let stuff init
        // TODO: Can't we do this with an event please?
        setTimeout(_.bind(this.captureQR, this), 500);
      }
    },

    isCanvasSupported: function() {
      var elem = document.createElement('canvas');
      return !!(elem.getContext && elem.getContext('2d'));
    },

    initCanvas: function() {
      this.gCanvas = $("#qr-canvas")[0];

      var w = 800;
      var h = 600;
      this.gCanvas.style.width = w+"px";
      this.gCanvas.style.height = h+"px";
      this.gCanvas.width = w;
      this.gCanvas.height = h;

      this.gCtx = this.gCanvas.getContext("2d");
      this.gCtx.clearRect(0, 0, w, h);
      this.imageData = this.gCtx.getImageData(0,0,320,240);
    },

    initQR: function() {
      var n=navigator;
      var vidhtml = '<video id="v" autoplay></video>';

      if(n.getUserMedia) {
        this.video=$("#video")[0];
        n.getUserMedia({video: true, audio: false}, _.bind(this.gotUserMedia, this), _.bind(this.errorGettingUserMedia, this));
      } else if (n.webkitGetUserMedia) {
        this.video=$("#video")[0];
        this.webkit=true;
        n.webkitGetUserMedia({video: true, audio: false}, _.bind(this.gotUserMedia, this), _.bind(this.errorGettingUserMedia, this));
      } else if(n.mozGetUserMedia) {
        this.video=$("#video")[0];
        n.mozGetUserMedia({video: true, audio: false}, _.bind(this.gotUserMedia, this), _.bind(this.errorGettingUserMedia, this));
      }
      else {
        console.debug("Setting up flash");
        swfobject.embedSWF("/flash/camcanvas.swf", "QRScanner", "320", "240", "8.0.0");
      }
    },

    captureQR: function() {
      if(this.gUM) {
        // Use canvas
        this.gCtx.drawImage(this.video,0,0);
      
        try {
          qrcode.decode();
        } catch(e) {
          console.log(e);
          setTimeout(_.bind(this.captureQR, this), 500);
        }
      } else {
        // Use Flash
        var flash = document.getElementById("QRScanner");
        
        try {
          flash.ccCapture();
        } catch(e) {
          setTimeout(_.bind(this.captureQR, this), 1000);
        }
      }
    }, 

    gotUserMedia: function(stream) {
      console.debug("Got canvas user media");
      if(this.webkit) {
        this.video.src = window.webkitURL.createObjectURL(stream);
      } else {
        this.video.src = stream;
      }
      this.gUM=true;
      setTimeout(_.bind(this.captureQR, this), 500);
    },

    errorGettingUserMedia: function(error) {
      // TODO: Check this case
      console.debug("Cannot get canvas user media")
      this.gUM = false;
      return;
    },

    handleRead: function(value) {
      console.debug(value);
      $.ajax({
        url: "/api/get_access_token",
        context: this,
        type: "GET",
        data: 'code='+value,
      }).done(_.bind(function(r) {
        if (r.success) {
          console.debug("Got an access token: " + r.access_token);
          this.model.set('user', {
            "access_token": r.access_token,
            "expires": r.expires
          });

          window.foo = function(r) {
            console.log("Global foo called");
            console.log(r);
          };

          $.ajax({
            url: "https://graph.facebook.com/me",
            crossDomain: true,
            data: {
              "method": "get",
              "access_token": this.model.get('user').access_token,
              "pretty": 0,
              "callback": "foo"
            }
          }).done(_.bind(function(r) {
            console.log(r);
          }, this));

        } else {
          console.error("Could not get access token from API endpoint");
        }
      }, this));
    }
    
  });

  return BoothView;
});