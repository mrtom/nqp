define([
  // Libraries.
  "jquery",
  "underscore",
  "backbone"
],

function($, _, Backbone) {

  // Device Auth Booth Model
  // ----------

  var Dab = Backbone.Model.extend({

    defaults: {
      pageletsInited: false,
      externalUID: "",
      deviceAuthCode: "",
      deviceAuthVerificationURL: ""
    },

    initialize: function() {
    },

    reset: function() {
      this.clear();

      for(var key in this.defaults) {
        this.set(key, this.defaults[key]);
      }
    }
  });

  return Dab;

});
