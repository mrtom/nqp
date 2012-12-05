define([
  // Libraries.
  "jquery",
  "underscore",
  "backbone"
],

function($, _, Backbone) {

  // Booth Model
  // ----------

  var Booth = Backbone.Model.extend({

    defaults: {
      pageletsInited: false
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

  return Booth;

});
