define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",

  // Models
  "models/user",

  // Views
  "views/main",
  "views/nav",

  // Templates
  "text!template/chromeTemplate.html"
],

function($, _, Backbone, Bootstrap, User, mainView, navView, chromeTemplate) {
  var ChromeView = Backbone.View.extend({

    chromeTemplate: _.template(chromeTemplate),

    initialize: function() {
      // Load appwide defaults
      // Turn on bootstrap data-api
      $('body').on('.data-api');
      
      this.user = new User;
      this.render();

      setTimeout(function(){
        // Hide the address bar on iPhones
        window.scrollTo(0, 1);
      }, 0);
    },

    render: function() {
      $(this.el).html(this.chromeTemplate());

      this.navView = new navView({ 
        el: this.$("#nav"),
        model: this.user
      });
      this.mainView = new mainView({ 
        el: this.$("#main"),
        model: this.user
      });
    }
  });

  return ChromeView;
});
