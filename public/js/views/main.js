define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",
  "qr",

  // Views
  "views/base",
  
  // Templates
  "text!template/mainTemplate.html"
],

/*
 * This is the main user view.
 * The responsiblity of this view is to show the user's QR code once they're logged in
 */
function($, _, Backbone, Bootstrap, qrGenerator, BaseView, mainTemplate) {

  var MainView = BaseView.extend({
    mainTemplate: _.template(mainTemplate),

    initialize: function() {
      var localStorageUser = this.options.router.getSavedUser();
      if (localStorageUser && localStorageUser.code) {
        // Draw QR code from native storage now
        this.drawQrCode(this.model, localStorageUser.code);
      }

      require( ['FB!'], _.bind(function() {
        this.model.on('change:code', this.drawQrCode, this);
        this.model.on('change:code_img', this.render, this);
        this.model.on('change:signedRequest', this.getCode, this);

        var view = this;

        FB.Event.subscribe('auth.authResponseChange', _.bind(function(response) {
          switch(response.status) {
            case 'unknown':
              // Fall through
            case 'not_authorized':
              this.model.set('signedRequest', null);
              this.options.router.removeSavedUser();
              break;
            case 'connected': 
              $('#loginModal').modal('hide');

              this.model.set('signedRequest', response.authResponse.signedRequest);
              
              break;
              default:
                console.log("Unexpected response from Facebook auth: `" + response.status + "` not recognised!")
          }
        }, this));
      }, this));
      this.render();
    },

    render: function() {
      $(this.el).html(this.mainTemplate(
        this.model.toJSON()
      ));
    },

    getCode: function() {
      var signedRequest = this.model.get('signedRequest');
      if (signedRequest) {
        $.ajax({
          url: "/api/gen",
          context: this,
          type: "POST",
          data: 'signed_request='+this.model.get('signedRequest'),
        }).done(function(r) {
          if (r.code) {
            this.model.set('code', r.code);
            this.options.router.saveUser();

          } else {
            // TODO: Error!
          }
        });        
      }
    },

    drawQrCode: function(model, code_to_draw) {
      var code = code_to_draw || this.model.get('code');
      if (!code) return;

      var qr = qrGenerator(4, 'M');
      qr.addData(code);
      qr.make();

      var node = qr.createImgTag(10);
      this.model.set('code_img', $(node).attr('src'));
    },

    destroy: function() {
      this.remove();
    }
  });

  return MainView;
});
