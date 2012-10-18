define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",

  // Templates 
  "text!template/navTemplate.html",
],

function($, _, Backbone, Bootstrap, navTemplate) {

  var NavView = Backbone.View.extend({
    navTemplate: _.template(navTemplate),

    initialize: function() {
      this.render();
      this.model.on('change', this.render, this);
    },

    render: function() {
      $(this.el).html(this.navTemplate(this.model.toJSON()));

      if (this.model.get('loaded')) {
        this.$('.not-logged-in').addClass('hide');
        this.$('.logged-in').removeClass('hide');
      } else {
        this.$('.not-logged-in').removeClass('hide');
        this.$('.logged-in').addClass('hide');
      }

      return this;
    }
  });

  return NavView;
});
