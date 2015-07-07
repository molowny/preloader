
/*
 * Preloader (pure js) - 1.0
 * It's automatic loading images from HTML structure and included CSS files, using Promise object (if supported).
 */




(function (root, factory) {

    if (typeof define === 'function' && define.amd) { // AMD
        define(factory);
    } else if (typeof exports === 'object') { // Node.js, CommonJS
        module.exports = factory();
    } else {
        root.preloader = factory; // Window
    }

}(this, function() {


  'use strict';



  var $ = {};



  $.defaults = {

    debug: false,

    // mode: 1, // 1: html, css | 2: html

    filesToLoad: [],

    allowed: ['jpg', 'jpeg', 'png', 'gif'],

    loadDelay: 0, // ms


    beforeLoad: function() {},

    afterLoad: function() {},

    onUpdate: function(percent) {}

  };


  $.regex = {
    src: /src=\"(.*?)\"/gm,
    url: /url\((.*?)\)/gm,
    css: /<link href=\"(.*?)\"/gm
  };



  $.html = String(document.querySelector("html").innerHTML);



  var loadFunctions = [];



  var init = function(customOptions) {

    try {

      checkPromiseSupport();

      if(typeof customOptions == 'object') {
        $.options = mergeOptions(customOptions);
      } else {
        $.options = $.defaults;
      }


      if($.options.filesToLoad.length) {

        // remove duplicates
        $.filelist = $.options.filesToLoad.filter(function(x, y) {
          return $.options.filesToLoad.indexOf(x) == y;
        });

        beforeLoad();


      } else {

        getFromHTML(getFromCSS);

      }



    } catch(err) {

      console.log(err);

    }

  };






  var mergeOptions = function(customOptions) {

    for(var key in customOptions) {

      if(typeof $.defaults[key] !== 'undefined') {

        $.defaults[key] = customOptions[key];

      } else {

        if($.defaults.debug) throw "There's no option called: '" + key + "'";

      }
    }

    return $.defaults;

  };



  var checkPromiseSupport = function() {
    if(typeof Promise !== "undefined" && Promise.toString().indexOf("[native code]") !== -1) {
      $.promise = true;
    } else {
      $.promise = false;
    }
  };





  var checkIfAllowed = function(file) {

    var getType = /([^.;+_]+)$/.exec(file),
        fileType = getType && getType[1];

    // checking if file format is defined in config as allowed
    if($.options.allowed.indexOf(fileType) > -1) {
      return true;
    } else {
      return false;
    }

  };



  var getFromHTML = function(callback) {

    var match, matches = [];

    while(match = $.regex.src.exec($.html)) {

      // checks if format is defined in config as allowed to load
      if(checkIfAllowed(match[1])) {
        matches.push(match[1]);
      }

    }

    while(match = $.regex.url.exec($.html)) {

      match = match[1].replace(/[']/g, ""); // delete ' if string contains

      // checks if fileformat is defined in config as allowed to load
      if(checkIfAllowed(match)) {
        matches.push(match);
      }

    }


    if(typeof callback == 'function') {
      callback();
    }

  };





  var getFromCSS = function() {

    var match, matches = [];

    while(match = $.regex.css.exec($.html)) {

      // making request to download css file
      var request = new XMLHttpRequest();
      request.open("GET", match[1], true);
      request.send();

      request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {

          // gets images from url('*')
          while(match = $.regex.url.exec(request.responseText)) {

            // delete ' if string contains
            match = match[1].replace(/[']/g, "");

            // checks if fileformat is defined in config as allowed to load
            if(checkIfAllowed(match)) {
              matches.push(match);
            }

          }


          // remove duplicates
          $.filelist = matches.filter(function(x, y) {
            return matches.indexOf(x) == y;
          });

          beforeLoad();

        }
      };

    }



  };




  var beforeLoad = function() {

    if(typeof $.options.beforeLoad == 'function') {
      $.options.beforeLoad();
    }

    load();
  }


  var load = function() {

    var promise, loaded = 0, percent = 0;

    /*
     * checks if promise is supported
     */

    if($.promise) {

      /*
       * main loading function
       * Map filelist and call function loadImage on each image that's returnig a Promise
       * Returns variable with all Promises
       */

      // map filelist
      var files = $.filelist.map(function (src) {

        // call function loadImage on each image
        return loadImage(src).then(function() {

          // update percentage on resolve
          loaded++;
          updatePercentage(loaded);

        }, function(error) {

          // update percentage on reject
          loaded++;
          updatePercentage(loaded);

        });

      });



      /*
       * When all Promises are resolved call afterLoad function
       */
      Promise.all(files).then(function () {
        $.complete = true;
        afterLoad();
      });



    } else {

      /*
       * if promise is not supported
       */

      $.loadedImages = 0;
      checkIfAllLoaded();

      for (var i = $.filelist.length - 1; i >= 0; i--) {
        loadImage($.filelist[i]);
      }

    }

  };


  var loadImage = function(src) {

    /*
     * checks if promise is supported
     */

    if($.promise) {

      return new Promise(function(resolve, reject) {

        // create image object
        var image = new Image();
        image.src = src;


        // handle events
        image.onload = function() {
          resolve();
        };

        image.onerror = function() {
          reject("Can't find: " + src);
        };

      });

    } else {

      /*
       * if Promise is not supported
       */

      // create image object
      var image = new Image();
      image.src = src;


      // handle events
      image.onload = function() {
        _self.loadedImages++;
        updatePercentage(_self.loadedImages);
      };

      image.onerror = function() {
        _self.loadedImages++;
        updatePercentage(_self.loadedImages);
      };

    }

  };



  var updatePercentage = function(loaded) {

    var percent = Number(parseFloat((loaded / $.filelist.length) * 100).toFixed(2));
    $.options.onUpdate(percent);

  };







  /*
   * afterLoad function
   * Function that is started when preloader is done loading
   * It's removing onload attr from images in DOM and it's starting function defined in config and functions added by onLoad function (with delay if defined in config)
   */

  var afterLoad = function() {

    // remove onload function from images in DOM added by init function at beginning
    // var images = document.images;

    // for (var i = images.length - 1; i >= 0; i--) {
    //   images[i].removeAttribute("onload");
    // }


    setTimeout(function() {

      // call standard function defined in config
      $.options.afterLoad();

      // call functions added by onLoad function
      for (var i = loadFunctions.length - 1; i >= 0; i--) {
        loadFunctions[i]();
      }

    }, $.options.loadDelay);

  };



  var onLoad = function(fn) {

    // check if preloader is done loading, if so call function
    if($.complete) {

      fn();

    } else {

      // if preloader is still loading images, add function to array of functions that will be fired when preloader is done loading

      if(typeof fn == 'function') {

        loadFunctions.push(fn);

      }
    }

  };


  return {
    preloader: $,
    init: init,
    onLoad: onLoad
  };



}()));



preloader.init({
  beforeLoad: function() {
    console.log(1);
  },
  afterLoad: function() {
    console.log(2);
  },
  onUpdate: function(per) {
    console.log(per + '%');
  }
});
