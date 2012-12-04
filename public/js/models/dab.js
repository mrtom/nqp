define([
  // Libraries.
  "jquery",
  "underscore",
  "backbone"
],

function($, _, Backbone) {

  // Booth Model
  // ----------

  var Dab = Backbone.Model.extend({

    initialize: function() {
      this.set("externalUID", "");
      this.set("deviceAuthCode", "");
      this.set("deviceAuthVerificationURL", "");
    }
  });

  return Dab;

});
