define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",

  // Views
  "views/base",

  // Templates 
  "text!template/navTemplate.html",
],

function($, _, Backbone, Bootstrap, BaseView, navTemplate) {

  var NavView = BaseView.extend({
    navTemplate: _.template(navTemplate),

    events: {
      "click .logged-in"  : "showAccount",
      "click .brand"      : "showMain"
    },

    initialize: function() {
      this.render();
      this.model.get('user').on('change', this.render, this);

      require( ['FB!'], _.bind(function() {
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
                this.model.get('user').set({
                  'uid': uid,
                  'name': r.name,
                  'pic': r.picture.data.url,
                  'loaded': true,
                  'signedRequest': signedRequest
                });

                this.model.get('user').set('signedRequest', response.authResponse.signedRequest);

              }, this));
              break;
              default:
                console.log("Unexpected responsen from Facebook auth: `" + response.status + "` not recognised!")
          }
        }, this));

        if (!this.model.get('signed_request')) {
          // Force FB auth.authResponseChange event
          FB.getLoginStatus();
        }
      }, this));
    },

    render: function() {
      $(this.el).html(this.navTemplate(this.model.toJSON()));

      if (this.model.get('user').get('loaded')) {
        this.$('.not-logged-in').addClass('hide');
        this.$('.logged-in').removeClass('hide');
      } else {
        this.$('.not-logged-in').removeClass('hide');
        this.$('.logged-in').addClass('hide');
      }

      return this;
    },

    showAccount: function() {
      this.options.router.navigate('account', {trigger: true });
    },

    showMain: function() {
      this.options.router.navigate('', { trigger: true });
    }
  });

  return NavView;
});
