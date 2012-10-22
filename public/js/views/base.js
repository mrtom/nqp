define([
  "backbone",
],

function(Backbone) {

  var BaseView = Backbone.View.extend({
   destroy: function() {
      this.remove();
    }
  });

  return BaseView;
});