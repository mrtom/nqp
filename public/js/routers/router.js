define([
  // Libraries.
  "jquery",
  "underscore",
  "backbone",

  // Models
  "models/fourohfour",

  // Views
  "views/chrome",
  "views/fourohfour"
], 

function($, _, Backbone, FourOhFour, ChromeView, FourOhFourView) {
  // App Router
  // ---------- 
                
  var Workspace = Backbone.Router.extend({

    routes: {
      ""            : "showChrome",
      "*other"      : "showFourOhFour"
    },

    showChrome: function() {
      console.log('Showing Chrome');
      this.destroyPrimary(this.fourohfour, this.fourohfourView);

      this.chromeView = new ChromeView({
        el: $('#bootstrap'),
        router: this
      });
    },

    showFourOhFour: function(route) {
      console.debug('Showing 404');
      this.destroyPrimary(this.main, this.mainView);

      this.fourohfour = new FourOhFour({
        route: route
      });
      this.fourohfourView = new FourOhFourView({
        el: $('#bootstrap'),
        router: this,
        model: this.fourohfour
      });
    },

    destroyPrimary: function(/* Backbone.Model */ model, /* Backbone.View */ view) {
      if (view) {
        view.destroy();
        view = null;
      }
      if (model) {
        model.clear({slient: true});
        model = null;
      }
    }

  });
                      
  return Workspace;
});
