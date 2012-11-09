define([
  // Libraries
  "jquery",
  "underscore",
  "backbone",
  "vendor/html5-webcam",

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

      this.video = $('.cameraViewer')[0];
      this.img = $('.cameraPic')[0];

      if (!this.webcam) {
        this.webcam = new WebCamController(this.video, this.img);
      } else {
        this.webcam.bindElements(this.video, this.img);
      }
    },

    takePhoto: function() {
      this.webcam.createSnapshot();
      alert("This doesn't actually do anything yet!");

      //$(this.video).addClass('hide');
      //$(this.img).removeClass('hide');
      //$('#takePhoto').attr("disabled", "true");
    }

  })

  return TakePhoto;
});
