/**
 * html5 methods for dealing with a webcam without a plugin.
 */

define(['jquery'], function($){
  /* APIs we need.
   *
   * This stuff is recently standardised, but only available under vendor
   * prefixes.
   *
   * Here we look for vendor prefixed versions, and provide a consistent API,
   * namespaced into 'html5'.
   */

  var html5 = {
    _findProperty: function (object, property) {
      if (object[property]) {
        // Yeah, right...
        return object[property];
      }
      property = property.charAt(0).toUpperCase() + property.slice(1);
      var prefixes = [
        'webkit',
        'moz',
      ];
      for (i in prefixes) {
        var prefix = prefixes[i];
        if (object[prefix + property]) {
          return object[prefix + property];
        }
      }
    }
  }

  $.extend(html5, {
    navigator: {
      getUserMedia: html5._findProperty(
        navigator,
        'getUserMedia'
      ).bind(navigator)
    },
    window: {
      URL: html5._findProperty(window, 'URL')
    }
  });

  /**
   * Now we get to the class that actually does something with those APIs :)
   */
  function WebcamController(video, img) {
    this._canvas = document.createElement('canvas');
    this._snapshot = null;

    html5.navigator.getUserMedia(
      {video: true},
      function(stream) {
        this._stream = stream;
        this.bindElements(video, img);
      }.bind(this),
      function(){}
    );
  }

  $.extend(WebcamController.prototype, {
    bindElements: function(video, img) {
      this._video = video;
      this._img = img;
      video.src = html5.window.URL.createObjectURL(this._stream);
      setTimeout(this.resizeCanvas.bind(this), 50);
    },
    resizeCanvas: function() {
      this._img.width = this._canvas.width = this._video.videoWidth;
      this._img.height = this._canvas.height = this._video.videoHeight;
    },
    createSnapshot: function() {
      this._canvas.getContext('2d').drawImage(this._video, 0, 0);
      this._snapshot = this._canvas.toDataURL('image/png');
      this._img.src = this._snapshot;
    },
    getSnapshot: function() {
      return this._snapshot;
    },
  });

  return WebcamController;
});