define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",

  // Models
  "models/booth",

  // Views
  "views/base",

  // Templates
  "text!template/boothPagelets/appUsers.html"
],

function($, _, Backbone, Booth, BaseView, appUsersTemplate) {

  var AppUsers = BaseView.extend({

    appUsersTemplate: _.template(appUsersTemplate),

    className: "appUsers",

    initialize: function() {
      this.fetchFriendsWhoUseApp();
    },

    render: function() {
      $(this.el).html(this.appUsersTemplate(this.model.toJSON()));
    },

    fetchFriendsWhoUseApp: function() {
      var fql = "SELECT uid, first_name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1 LIMIT 5";

      var callbackName = this.options.router.addCallback(_.bind(function(r) {
        this.model.set('friends', r.data);

        this.render();
      }, this));

      $.ajax({
        url: "https://graph.facebook.com/fql",
        crossDomain: true,
        data: {
          "q": fql,
          "method": "get",
          "access_token": this.model.get('user').access_token,
          "pretty": 0,
          "callback": callbackName
        }
      });
    }

  })

  return AppUsers;
});
