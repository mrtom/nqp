define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "text!template/fourohfourTemplate.html"
],

function($, _, Backbone, fourohfourTemplate) {

  var FourOhFourView = Backbone.View.extend({

    fourohfourTemplate: _.template(fourohfourTemplate),

    className: "fourOhFour",

    initialize: function() {
      this.render();
    },

    render: function() {
      $(this.el).html(this.fourohfourTemplate(this.model.toJSON()));
    },

    destroy: function() {
      this.remove();
    }

  })

  return FourOhFourView;
});
