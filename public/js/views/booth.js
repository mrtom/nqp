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
  "views/boothPagelets/appUsers",
  "views/boothPagelets/fbPics",
  "views/boothPagelets/takePhoto",

  // Templates
  "text!template/boothNoUserTemplate.html",
  "text!template/boothWithUserTemplate.html"
],

/*
 * The Booth View
 * The purpose of this view is to ask the user to log in (via their QR code), and then demonstrate that the content
 * can be personalised to the user using the Facebook APIs
 *
 * Please note, it is just a demo! This is not supposed to represent a fully working booth, as the content required
 * would be specific for each installation
 */
function($, _, Backbone, Bootstrap, swfobject, qrcode, Booth, BaseView, AppUsersView, FBPicsView, TakePhotoView, boothNoUserTemplate, boothWithUserTemplate) {
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

    events: {
      "click #logOutBooth" : "logOutBooth"
    },

    initialize: function() {
      // Load appwide defaults
      // Turn on bootstrap data-api
      $('body').on('.data-api');

      if (this.options.code) {
        // We already have the user code. Just render the user page
        // This is only used for quick access during debugging
        // Don't use in production! TODO: Enforce this rule programatically
        this.handleRead(this.options.code);
        $('#bootstrap').append(this.$el);
      } else {
        // Load QR support
        if (!this.isCanvasSupported()) {
          var errorStr = "This demo requires canvas! Aborting...";
          console.error(errorStr);
          alert(errorStr);

          return;
        }
        $('#bootstrap').append(this.$el);
        this.render();
      }
    },

    render: function() {
      var username = this.model.get('username')

      if (username) {
        $(this.el).html(this.boothWithUserTemplate(this.model.toJSON()));
        this.renderPagelets();
      } else {
        $(this.el).html(this.boothNoUserTemplate());
        this.initCanvas();
        qrcode.callback = _.bind(this.handleRead, this);

        this.initQR();        
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
      this.video=$("#video")[0];

      if(n.getUserMedia) {
        n.getUserMedia({video: true, audio: false}, _.bind(this.gotUserMedia, this), _.bind(this.errorGettingUserMedia, this));
      } else if (n.webkitGetUserMedia) {
        this.webkit=true;
        n.webkitGetUserMedia({video: true, audio: false}, _.bind(this.gotUserMedia, this), _.bind(this.errorGettingUserMedia, this));
      } else if(n.mozGetUserMedia) {
        n.mozGetUserMedia({video: true, audio: false}, _.bind(this.gotUserMedia, this), _.bind(this.errorGettingUserMedia, this));
      } else {
        this.video = null;
        swfobject.embedSWF("/flash/camcanvas.swf", "QRScanner", "320", "240", "8.0.0");
      }

      // Start polling for QR codes. Add timeout to let stuff init
      // TODO: Can't we do this with an event please?
      setTimeout(_.bind(this.captureQR, this), 500);
    },

    captureQR: function() {
      if (this.model.get('username')) {
        // We don't need to capture anymore
        return;
      }

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
          console.log(e);
          setTimeout(_.bind(this.captureQR, this), 1000);
        }
      }
    }, 

    gotUserMedia: function(stream) {
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
      this.gUM = false;
      return;
    },

    renderPagelets: function() {
      // Add in the pagelets
      this.appUsersPagelet = new AppUsersView({
        el: this.$('.appUsers'),
        model: this.model,
        router: this.options.router
      });

      this.facebookPicsPagelet = new FBPicsView({
        el: this.$('#fbpics'),
        model: this.model,
        router: this.options.router
      });

      this.newPicPagelet = new TakePhotoView({
        el: this.$('#takenew'),
        model: this.model,
        router: this.options.router
      });
    },

    handleRead: function(value) {
      $.ajax({
        url: "/api/get_access_token",
        context: this,
        type: "GET",
        data: 'code='+value,
      }).done(_.bind(function(r) {
        if (r.success) {
          this.model.set('user', {
            "access_token": r.access_token,
            "expires": r.expires
          });

          var callbackName = this.options.router.addCallback(_.bind(function(r) {
            this.model.set('username', r.name);
            this.model.set('profilePic', r.picture.data.url);

            this.render();
          }, this));

          $.ajax({
            url: "https://graph.facebook.com/me",
            crossDomain: true,
            data: {
              "fields": "id,name,picture.type(large)",
              "method": "get",
              "access_token": this.model.get('user').access_token,
              "pretty": 0,
              "callback": callbackName
            }
          });
        } else {
          console.error("Could not get access token from API endpoint");
        }
      }, this));
    },

    logOutBooth: function() {
      this.model.reset();
      this.render();
    }
    
  });

  return BoothView;
});
