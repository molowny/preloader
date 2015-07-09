
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

    getFromCSS: true,

    filesToLoad: [],

    allowed: ['jpg', 'jpeg', 'png', 'gif'],

    loadDelay: 0, // ms


    beforeLoad: function() {},

    afterLoad: function() {},

    onUpdate: function(percent) {}

  };


  $.regex = {
    files: /(href="(.*?)")|(src="(.*?)")|(url\((.*?)\))/g,
    junk: /(&quot;)|(')|(")/g,
    breaks: ["2", "4", "6"]
  };



  $.html = String(document.querySelector("html").innerHTML);
  $.css = [];



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

        $.filelist = function() {

          var images = [];
          for (var i = $.options.filesToLoad.length - 1; i >= 0; i--) {
            if(filter($.options.filesToLoad[i]) === 'image') {
              images.push($.options.filesToLoad[i]);
            }
          };

          if(images.length <= 0 && $.options.debug) throw 'Error: Badly defined custom filelist.';

          return images;

        }();

        beforeLoad();

    } else {

      getImages(function(matches) {

        // remove duplicates
        $.filelist = matches.filter(function(x, y) {
          return matches.indexOf(x) == y;
        });


        beforeLoad();


      });

    };


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




  var getImages = function(callback) {

    var matches = [];

    // exec html with regex
    while(match = $.regex.files.exec($.html)) {

      for (var i in $.regex.breaks) {

        if(typeof match[$.regex.breaks[i]] !== 'undefined') {

          var match = match[$.regex.breaks[i]].replace($.regex.junk, "");

          if(filter(match) === 'image') {

            matches.push(match);

          } else if(filter(match) === 'css') {

            $.css.push(match);

          }

        }

      };

    }


    if($.options.getFromCSS) {

      var request = [];

      for (var i = $.css.length - 1; i >= 0; i--) {

        (function(i) {

          request[i] = new XMLHttpRequest();
          request[i].open("GET", $.css[i], true);
          request[i].send();

          request[i].onreadystatechange = function() {

            if (request[i].readyState == 4 && request[i].status == 200) {

              while(match = $.regex.files.exec(request[i].responseText)) {

                var match = match[6].replace($.regex.junk, "");

                if(filter(match) === 'image') {

                  matches.push(match);

                }

              }

              if(!i) {

                callback(matches);

              }

            }
          }




        })(i);



      };


    } else {

      callback(matches);

    }
  };






  // filter matches from regex
  var filter = function (file) {

    var getType = /([^.;+_]+)$/.exec(file),
        fileType = getType && getType[1];

    if($.options.allowed.indexOf(fileType) > -1) {
      return 'image';
    } else {
      return fileType;
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
        $.loadedImages++;
        updatePercentage($.loadedImages);
      };

      image.onerror = function() {
        $.loadedImages++;
        updatePercentage($.loadedImages);
      };

    }

  };



  var updatePercentage = function(loaded) {

    var percent = Number(parseFloat((loaded / $.filelist.length) * 100).toFixed(2));
    $.options.onUpdate(percent);

  };




  // function that checks if all files are loaded
  var checkIfAllLoaded = function() {

    var checkIfLoaded = setInterval(function() {

      if($.loadedImages === $.filelist.length) {

        $.complete = true;
        afterLoad();

        clearInterval(checkIfLoaded);
      }

    }, 50);
  };




  /*
   * afterLoad function
   * Function that is started when preloader is done loading
   * It's removing onload attr from images in DOM and it's starting function defined in config and functions added by onLoad function (with delay if defined in config)
   */

  var afterLoad = function() {

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
