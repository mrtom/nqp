define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",

  // Models
  "models/dab",

  // Views
  "views/base",
  "views/boothPagelets/appUsers",
  "views/boothPagelets/fbPics",
  "views/boothPagelets/takePhoto",

  // Templates
  "text!template/dabNoUserTemplate.html",
  "text!template/boothWithUserTemplate.html",
],

/*
 * The Booth View, for Device Auth (or Device Auth Booth - DAB)
 * The purpose of this view is to ask the user to log in Facebook Device Auth, and then demonstrate that the content
 * can be personalised to the user using the Facebook APIs
 *
 * Please note, it is just a demo! This is not supposed to represent a fully working booth, as the content required
 * would be specific for each installation
 */
function($, _, Backbone, Bootstrap, Booth, BaseView, AppUsersView, FBPicsView, TakePhotoView, dabNoUserTemplate, boothWithUserTemplate) {
  var DabView = BaseView.extend({

    dabNoUserTemplate: _.template(dabNoUserTemplate),
    boothWithUserTemplate: _.template(boothWithUserTemplate),

    events: {
      "click #scanCard" : "cardScanned"
    },

    initialize: function() {
      // Load appwide defaults
      // Turn on bootstrap data-api
      $('body').on('.data-api');

      // Load Device Auth support
      $('#bootstrap').append(this.$el);
      this.render();
    },

    render: function() {
      var username = this.model.get('username')

      if (username) {
        $(this.el).html(this.boothWithUserTemplate(this.model.toJSON()));

        if (!this.pageletsInited) {
          this.initPagelets();
        }
      } else {
        $(this.el).html(this.dabNoUserTemplate(this.model.toJSON()));

        if (this.model.get("fadeNode")) {
          $("#scanCardRow").addClass("hidden");

          this.setInitialDisplay("externalUID");
          this.setInitialDisplay("deviceAuthCode");

        } else {
          $("#externalUIDRow").addClass("hidden");
          $("#deviceAuthCodeRow").addClass("hidden");
        }        
      }
    },

    setInitialDisplay: function(/* String */ nodeID) {
      // We fade in the deviceAuthRow and externalUIDRow when they're set
      // But, once set, we just want them to be shown by default

      var fadeNode = this.model.get("fadeNode");
      var node = $("#"+nodeID+"Row");

      if (fadeNode === nodeID) {
        node.css("display", "none").removeClass("hidden").fadeIn(200);
      } else {
        if (this.model.get(nodeID)) {
          node.removeClass("hidden");
        } else {
          node.addClass("hidden");
        }
      }
    },

    cardScanned: function() {
      console.debug("Card scanned");

      var externalUID = $("#cardNumber").val();
      if (!externalUID) {
        externalUID = new Date().getTime() + String(Math.random()).substr(2);
      }

      this.model.set('externalUID', externalUID);
      this.model.set('fadeNode', 'externalUID');

      $("#scanCardRow").fadeOut(
        200,
        _.bind(function() {
          this.render();         
        }, this)
      );

      $.ajax({
        url: "/api/get_access_token_or_device_auth_code",
        context: this,
        type: "GET",
        data: "externalUID="+externalUID
      }).fail(_.bind(function(r){
        // TODO: Handle error case better
        console.log("Failed to get device auth code from Facebook");
        console.log(r);
      })).done(_.bind(function(r){
        this.deviceAuthCodeReceived(r);
      }, this));    
    },

    deviceAuthCodeReceived: function(r) {
      var data = r.data;

      this.model.set("deviceAuthCode", data.user_code);
      this.model.set("deviceAuthVerificationURL", data.verification_uri);
      this.model.set("deviceAuthVerificationCode", data.code);
      this.model.set("deviceAuthInterval", data.interval);
      this.model.set('fadeNode', 'deviceAuthCode');

      // Poll Facebook
      this.facebookPoller = setInterval(_.bind(this.checkFacebookForUpdateFromUser, this), data.interval*1000);

      // Update UI
      this.render();
    },

    checkFacebookForUpdateFromUser: function() {
      $.ajax({
        url: "/api/check_for_access_token",
        context: this,
        type: "GET",
        data: "verificationCode="+this.model.get('deviceAuthVerificationCode')
      }).fail(function(r){
        // TODO: Handle error case better
        console.log("Failed to get device auth code from Facebook");
        console.log(r);
      }).done(_.bind(function(r){
        // Check success, as we can get a success before the user has verified
        if (r.success === "true" && r.data.access_token) {
          clearInterval(this.facebookPoller);
          this.facebookPoller = null;

          this.handleReceiveAccessToken(r.data.access_token);
        } else {
          switch(r.message) {
            case "authorization_pending":
              // Do nothing, fall through
            case "slow_down":
              // Do nothing, (we only ever poll at the frequence FB tells us to, so we shouldn't see this)
              break;
            case "expired":
              // Code expired. Start over.
              // Fall through
            case "authorization_declined":
              // User declined. Start over.
              this.resetBooth();
              break;
          }
        }

      }, this));
    },

    resetBooth: function() {
      this.model.set("externalUID", "");
      this.model.set("deviceAuthCode", "");
      this.model.set("deviceAuthVerificationURL", "");
      this.model.set("deviceAuthVerificationCode", "");
      this.model.set("deviceAuthInterval", "");
      this.model.set("fadeNode", "");
    },

    initPagelets: function() {
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

      this.pageletsInited = true;
    },

    handleReceiveAccessToken: function(access_token) {
      this.model.set('user', {
        "access_token": access_token
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
    }
    
  });

  return DabView;
});
