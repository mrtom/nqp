define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",

  // Models
  "models/user",

  // Views
  "views/base",

  // Templates
  "text!template/fourohfourTemplate.html"
],

function($, _, Backbone, User, BaseView, fourohfourTemplate) {

  var FourOhFourView = BaseView.extend({

    fourohfourTemplate: _.template(fourohfourTemplate),

    className: "fourOhFour",

    initialize: function() {
      this.render();
    },

    render: function() {
      $(this.el).html(this.fourohfourTemplate(this.model.toJSON()));
    }

  })

  return FourOhFourView;
});
