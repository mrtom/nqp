define([
  // Libraries.
  "jquery",
  "underscore",
  "backbone",

  // Models
  "models/user"
],

function($, _, Backbone, User) {

  // Main Model
  // ----------

  var Main = Backbone.Model.extend({

    // Default attributes for the User
    defaults: {
    },

    initialize: function() {
      this.user = new User();
    }
  });

  return Main;

});
