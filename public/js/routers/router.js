define([
  // Libraries.
  "jquery",
  "underscore",
  "backbone",

  // Models
  "models/account",
  "models/fourohfour",
  "models/user",

  // Views
  "views/account",
  "views/chrome",
  "views/fourohfour",
  "views/main"
], 

function($, _, Backbone, Account, FourOhFour, User, AccountView, ChromeView, FourOhFourView, MainView) {
  // App Router
  // ---------- 
                
  var Workspace = Backbone.Router.extend({

   localStorageKey: "nqp-user",

    routes: {
      ""            : "showChrome",
      "account"     : "showAccount",
      "*other"      : "showFourOhFour"
    },

    initialize: function() {
      this.user = new User;
    },

    // Show the main page
    showChrome: function(mainModel, mainViewType) {
      console.debug('Showing Chrome');
      this.destroyPrimary(this.chrome, this.chromeView);

      if (!mainViewType) {
        console.debug("No view specified. Showing mainView");
        mainViewType = MainView;
        mainModel = this.user;
      }

      this.chromeView = new ChromeView({
        router: this,
        mainModel: mainModel,
        mainViewType: mainViewType,
        user: this.user
      });
    },

    // show the account/profile page
    showAccount: function() {
      console.debug('Showing account')
      return this.showChrome(new Account({
        user: this.user
      }), AccountView);
    },

    showFourOhFour: function(route) {
      console.debug('Showing 404');
      this.destroyPrimary(this.chrome, this.chromeView);

      this.showChrome(
        new FourOhFour({
          route: route
        }),
        FourOhFourView
      );
    },

    destroyPrimary: function(/* Backbone.Model */ model, /* Backbone.View */ view) {
      if (view) {
        view.destroy();
        view = null;
      }
      if (model) {
        model.clear({silent: true});
        model = null;
      }
    },

    saveUser: function() {
      // Store in localStorage
      if (localStorage) {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.user));
        return true;
      }
      return false;
    },

    getSavedUser: function() {
      if (localStorage) {
        return JSON.parse(localStorage.getItem(this.localStorageKey));
      }
      return null;
    },

    removeSavedUser: function() {
      if (localStorage) {
        localStorage.removeItem(this.localStorageKey);
      }
      return false;
    }

  });
                      
  return Workspace;
});
