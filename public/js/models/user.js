define([
  // Libraries.
  "jquery",
  "underscore",
  "backbone"
],

function($, _, Backbone) {

  // User Model
  // ----------

  var User = Backbone.Model.extend({

    // Default attributes for the User
    defaults: {
      notLoggedIn: 'Login to continue...',
      loaded: false,
      pic: "",
      code_img: "http://placehold.it/400x400"
    },

    initialize: function() {
      if (!this.get("name")) this.set("name", this.defaults.notLoggedIn);
      if (!this.get("loaded")) this.set("loaded", this.defaults.loaded);
      if (!this.get("code_img")) this.set("code_img", this.defaults.code_img);
    }
  });

  return User;

});
