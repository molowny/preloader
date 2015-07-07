# preloader
Pure js preloader which gets files from html and css

### Usage
Install via bower:
````
bower install preloader-rg
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
filesToLoad | array | [] | You can specify which files have to be loaded. Preloader will not get files from html nor css 
allowed | array | ['jpg', 'jpeg', 'png', 'gif'] | You can specify allowed filetypes
loadDelay | number | 0 | loadDelay is used for timeout function after load is completed


### Events
Event | Params
------ | ---- 
beforeLoad | -
afterLoad | -
onUpdate | percent


### Methods
##### onLoad
````
preloader.onLoad(function(){
  // your function called after load is completed
});
````


### Example
Init preloader:
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

Use methods (wherever you want)
````
preloader.onLoad(function() {
  alert('Loaded');
  // some function
});
````