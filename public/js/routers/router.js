define([
  // Libraries.
  "jquery",
  "underscore",
  "backbone",

  // Models
  "models/fourohfour",
  "models/user",

  // Views
  "views/chrome",
  "views/fourohfour",
  "views/main"
], 

function($, _, Backbone, FourOhFour, User, ChromeView, FourOhFourView, MainView) {
  // App Router
  // ---------- 
                
  var Workspace = Backbone.Router.extend({

  localStorageKey: "nqp-user",
  callbackIndex: 0,


  routes: {
    ""            : "showChrome",
    "account"     : "showAccount",
    "booth"       : "showBooth",
    "booth/*code" : "showBooth",
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
    console.debug('Showing account');
    require(['models/account', 'views/account'], _.bind(function(Account, AccountView){
      return this.showChrome(new Account({
        user: this.user
      }), AccountView);
    }, this));
  },

  // show the booth
  showBooth: function(code) {
    console.debug('Showing booth');

    // Require Booth inline as we don't want to ship all the extra stuff
    // to the user client
    require(['models/booth', 'views/booth'], _.bind(function(Booth, BoothView){
      this.destroyPrimary(this.chrome, this.chromeView);

      this.boothModel = new Booth();
      this.boothView = new BoothView({
        router : this,
        model  : this.boothModel,
        code   : code
      });
    }, this));
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
  },

  addCallback: function(/* function */ cb) {
    var functionName = "global_callback_"+this.callbackIndex;
    window[functionName] = function(response) {
      cb(response);
      window[functionName] = null;
    };

    this.callbackIndex++;
    return functionName;
  }

});
                    
return Workspace;
});
