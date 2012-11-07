define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "plugins/jquery.masonry.min",

  // Models
  "models/booth",

  // Views
  "views/base",

  // Templates
  "text!template/boothPagelets/fbPics.html"
],

function($, _, Backbone, Masonry, Booth, BaseView, fbPicsTemplate) {

  var FBPics = BaseView.extend({

    fbPicsTemplate: _.template(fbPicsTemplate),

    className: "fbPics",

    initialize: function() {
      this.fetchRecentPics();
    },

    render: function() {
      $(this.el).html(this.fbPicsTemplate(this.model.toJSON()));
    },

    fetchRecentPics: function() {
      var callbackName = this.options.router.addCallback(_.bind(function(r) {
        this.model.set('fb_pics', r.data);
        this.render();
        
        var imgGrid = $('.thumbnails');
        imgGrid.imagesLoaded(function(){
          imgGrid.masonry({
            isAnimated: true,
            itemSelector : '.thumb',
            columnWidth : function(containerWidth) {
              return containerWidth/3;
            }
          });
        });
        
      }, this));

      $.ajax({
        url: "https://graph.facebook.com/me/photos",
        crossDomain: true,
        data: {
          "method": "get",
          "access_token": this.model.get('user').access_token,
          "pretty": 0,
          "limit": 27,
          "callback": callbackName
        }
      });
    }
  })
  return FBPics;
});
