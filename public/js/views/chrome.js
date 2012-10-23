define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",

  // Models
  "models/nav",
  "models/user",

  // Views
  "views/base",
  "views/nav",

  // Templates
  "text!template/chromeTemplate.html"
],

// Loads a main view within the app Chrome, i.e. with the NavBar
function($, _, Backbone, Bootstrap, Nav, User, BaseView, navView, chromeTemplate) {
  var ChromeView = BaseView.extend({

    chromeTemplate: _.template(chromeTemplate),

    initialize: function() {
      // Load appwide defaults
      // Turn on bootstrap data-api
      $('body').on('.data-api');
      
      this.render();

      $('#bootstrap').append(this.$el);

      setTimeout(function(){
        // Hide the address bar on iPhones
        window.scrollTo(0, 1);
      }, 0);
    },

    render: function() {
      $(this.el).html(this.chromeTemplate());

      this.navView = new navView({ 
        el: this.$("#nav"),
        model: new Nav({ user: this.options.user }),
        router: this.options.router
      });
      this.mainView = new this.options.mainViewType({ 
        el: this.$("#main"),
        model: this.options.mainModel,
        router: this.options.router
      });
    },

    destroy: function() {
      this.navView.destroy();
      this.mainView.destroy();
    }
  });

  return ChromeView;
});
