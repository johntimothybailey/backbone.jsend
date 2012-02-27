# Backbone.JSend #
Why: If you are currently using Backbone in your front-end and [JSend][d] on your Service Layer, then this makes
integration into Backbone Models and Collections simple. If you are needing a common response from the Service Layer
and get more intelligent instructions from the Service Layer, then check out this project and [JSend][d]

[d]: http://labs.omniti.com/labs/jsend

## Usage ##

Assuming the urls as show below will respond with JSON and with the JSend Spec:

```javascript
var MainModel = Backbone.Model.extend({});

// Mixin to the model instance or Model "class" the JSend Response
_.extend(MainModel.prototype,Backbone.JSend.ResponseMixin);

var MainView = Backbone.View.extend({
  initialize: function(options){
    this.model = new MainModel;
    this.model.bind("error",function(){
      console.log("Error was dispatched from the model with ",arguments);
    });
    this.model.url = "/service/success";
    this.model.fetch({success:function(){
      console.log("using a success callback");
    }});
    this.model.url = "/service/error";
    this.model.fetch();
    this.model.url = "/service/doesntexist";
    this.model.fetch();
  }
});
var mainview = new MainView;
```

## Changelog ##

Currently in progress of first release

### 0.1.0 ###

* Currently in progress of first release

## Contributors list ##


## Licence ##

The MIT License

Copyright (c) 2012 John Timothy Bailey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
