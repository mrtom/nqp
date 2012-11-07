define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "html5WebCam",

  // Models
  "models/booth",

  // Views
  "views/base",

  // Templates
  "text!template/boothPagelets/takePhoto.html"
],

function($, _, Backbone, WebCamController, Booth, BaseView, takePhotoTemplate) {

  var TakePhoto = BaseView.extend({

    takePhotoTemplate: _.template(takePhotoTemplate),

    className: "takePhoto",

    initialize: function() {
      this.render();

      $('#takePhoto').click(_.bind(this.takePhoto, this));
    },

    render: function() {
      $(this.el).html(this.takePhotoTemplate(this.model.toJSON()));

      var video = $('.cameraViewer')[0];
      var img = $('.cameraPic')[0];

      if (!this.webcam) {
        this.webcam = new WebCamController(video, img);
      } else {
        this.webcam.bindElements(video, img);
      }
    },

    takePhoto: function() {
      this.webcam.createSnapshot();
      console.log(this.webcam.getSnapshot());
    }

  })

  return TakePhoto;
});
