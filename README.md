# preloader
Pure js image preloader which get files from HTML and CSS.

### Usage
Install:
````
// bower
bower install preloader-rg

// npm
npm install preloader-rg
````

Initialize with:
````
preloader.init({
  // custom options
});
````

### Options
Option | Type | Default | Description
------ | ---- | ------- | ----
debug | boolean | false | When set to true, you will get optional errors in your console.
getFromCSS | boolean | true | When set to false, images will be loaded only from HTML source.
filesToLoad | array | [] | You can specify which files have to be loaded. Preloader will not get files from html nor css then.
allowed | array | ['jpg', 'jpeg', 'png', 'gif'] | You can specify allowed filetypes.
loadDelay | number | 0 | Delay is used for timeout function after load is completed.


### Events
Event | Params
------ | ---- 
beforeLoad | -
afterLoad | -
onUpdate | percent


### Methods
##### onLoad
````
preloader.onLoad(function() {
  // your function called after load is completed
});
````


### Example
````
preloader.init({

  loadDelay: 325,

  afterLoad: function() {
    var main = document.querySelector('main');
    main.className = 'loaded';
  },

  onUpdate: function(percent) {
    var line = document.querySelector('.preloader');
    line.style.width = percent + '%';
  }

});
````

Use methods (wherever you want):
````
preloader.onLoad(function() {
  alert('Loaded');
  // some function
});
````
