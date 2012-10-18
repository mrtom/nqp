define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",
  "qr",
  
  // Templates
  "text!template/mainTemplate.html"
],

function($, _, Backbone, Bootstrap, qr, mainTemplate) {

  var MainView = Backbone.View.extend({
    mainTemplate: _.template(mainTemplate),

    initialize: function() {
      require( ['FB!'], _.bind(function() {
          this.model.on('change:code', this.drawQrCode, this);
          this.model.on('change:code_img', this.render, this);

          var view = this;

          FB.Event.subscribe('auth.statusChange', _.bind(function(response) {
            switch(response.status) {
              case 'unknown':
                // Fall through
              case 'not_authorized':
                console.debug('Must login!');
                window.FB.XFBML.parse($('#loginModal')[0]);
                $("#loginModal").modal();
                break;
              case 'connected': 
                $('#loginModal').modal('hide');

                var uid = response.authResponse.userID;
                var signedRequest = response.authResponse.signedRequest;
                console.debug('woop! Welcome user #'+uid);

                FB.api('me?fields=id,name,picture.type(square)', _.bind(function(r) {
                  this.model.set({
                    'uid': uid,
                    'name': r.name,
                    'pic': r.picture.data.url,
                    'loaded': true,
                    'signedRequest': signedRequest
                  });

                  $.ajax({
                    url: "/api/gen",
                    context: this,
                    type: "POST",
                    data: 'signed_request='+signedRequest,
                  }).done(function(r) {
                    if (r.code) {
                      this.model.set('code', r.code);
                    } else {
                      // TODO: Error!
                    }
                  });
                  }, this));
                break;
                default:
                  console.log("Unexpected responsen from Facebook auth: `" + response.status + "` not recognised!")
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

    drawQrCode: function() {
      var code = this.model.get('code');
      if (!code) return;

      var qr = qrcode(4, 'M');
      qr.addData(code);
      qr.make();

      var node = qr.createImgTag();
      this.model.set('code_img', $(node).attr('src'));
    },

    destroy: function() {
      this.remove();
    }
  });

  return MainView;
});
