/**
 * Backbone.JSend
 * version 0.1.0
 * Copyright (c) 2012 John Timothy Bailey
 * backbone.jsend is freely distributable under the MIT license.
 */
(function(){
  var JSendStandardResponseStatus = {
    FAIL:     "fail",
    SUCCESS:  "success",
    ERROR:    "error"
  };
  var Events = {
    VALIDATION_FAIL:  "slValidationFail"
  };
  /**
   * Modifies the Success and Error options and then just calls the sync
   * @param method
   * @param model
   * @param options
   */
  var JSendSync = function (method, model, options) {
    options = options || {};
    options.originalSuccessCallback  = options.success;
    options.originalErrorCallback    = options.error;
    /**
     * Because JSend does not rely on HTTP response status we can get a status of 200 back from the server
     *    at which point this could still contain an error or fail
     */
    var successCallback = function (resp, status, xhr) {
      options.success     = options.originalSuccessCallback;
      model.handleResponse(resp, status, xhr, options);
    };
    options.success = successCallback;

    Backbone.sync(method, model, options);

    // TODO: Use this release concept for canceling requests. We really need to be able to use a Timestamp for when the request was generated
    //model.queuedRequests || (model.queuedRequests = []);
    //model.queuedRequests.push({key:method, callbacks:{success:options.success, error:options.error}});
  };
  /**
   * It is possible that we may want to use more unique handler names. However, it is easily possible to invoke this like so
   *      JSendResponseMixin.prototype.handleErrorEvent.apply(this, [model,response,options]);
   *      instead of having to mix it in via _.extend
   */
  var JSendResponseMixin = {
    /**
     * We are going to easily allow custom Status values and even extension of values by referencing them as so this.ResponseStatus.FAIL
     */
    ResponseStatus:JSendStandardResponseStatus, // Use the default Status object
    /**
     * We are going to easily allow custom Events values and even extension of values by referencing them as so this.JSendEvents.VALIDATION_FAIL
     */
    JSendEvents:Events, // Use the default Events objects
    /**
     * For now we are going to just replace the "sync" function on the model/collection
     */
    sync: JSendSync,
    /**
     * Provides a way for the developer to hook into the JSend process if not using JSendSync
     * This should be bound to the model listening to "error" on the model (e.g. model.bind("error",model.handleErrorEvent); )
     *
     * @param model     Backbone.Model instance that dispatched the "error" event
     * @param response  The JSON response from the server (in our situation this should be a JSend response)
     * @param options   Any options passed to the invoking function, most likely "save" or "fetch"
     */
    handleErrorEvent:function (model, response, options) {
      switch (response.status) {
        case this.ResponseStatus.FAIL:
          if (_.isFunction(this.handleResponseFailStatus))
            this.handleResponseFailStatus(response, options);
          break;

        case this.ResponseStatus.ERROR:
          if (_.isFunction(this.handleResponseErrorStatus))
            this.handleResponseFailStatus(response, options);
          break;
      }
    },
    /**
     *
     * @param response
     * @param options
     */
    handleResponseFailStatus:function (response, options) {
      var event = this.getJSendFailObject(response, options);
      this.trigger(this.JSendEvents.VALIDATION_FAIL, event);
      if ( _.isFunction(this.handleSLValidationFail) ) {  // The idea (currently in progress) was for us to be able to turn off the default by simply setting it to null
        this.handleSLValidationFail(event);
      }
    },
    /**
     * This method is called when the response has a status of "error"
     *
     * TODO: We may be able to just wrap the success method with the status and xhr being passed in instead of doing it via options.__syncData
     *
     * @param response
     * @param options
     */
    handleResponseErrorStatus:function (response, options) {
      var syncData = this._getSyncData(options);
      this._cleanOptions(options);
      if( _.isFunction(options.error) )
        options.error(this.getJSendErrorObject(response,options), syncData.status, syncData.xhr);
    },

    /**
     * This method is called when the response has a status of "success"
     *
     * TODO: We may be able to just wrap the success method with the status and xhr being passed in instead of doing it via options.__syncData
     *
     * @param response
     * @param options
     */
    handleResponseSuccessStatus:function (response, options) {
      var syncData = this._getSyncData(options);
      this._cleanOptions(options);
      options.success(response.data, syncData.status, syncData.xhr);
    },

    /**
     *
     * @param response
     * @param xhr
     * @param options
     */
    handleResponse: function ( response, status, xhr, options ){
      // TODO: Validate that the response is in fact a JSend JSON object
      switch(response.status ){
        case this.ResponseStatus.FAIL:
          if (_.isFunction(this.handleResponseFailStatus))
            this.handleResponseFailStatus(response, options);
          break;

        case this.ResponseStatus.ERROR:
          options.__syncData = {
            status: status,
            xhr:    xhr
          };
          if (_.isFunction(this.handleResponseErrorStatus))
            this.handleResponseErrorStatus(response, options);
          break;

        case this.ResponseStatus.SUCCESS:
          options.__syncData = {
            status: status,
            xhr:    xhr
          };

          if(_.isFunction(this.handleResponseSuccessStatus))
            this.handleResponseSuccessStatus(response, options);
          break;
      }
    },
    /**
     * Provides an opportunity to adjust the data that will be used in event dispatching or other similar response mechanisms
     * If you use particular codes or something else in your response this would be the method to override to provide that information
     *
     * The default is to only provide the required and optional keys as defined by JSend minus the status
     *
     * NOTE: I'm not convinced this is needed
     *
     * @param response
     * @param options
     *
     * @return an Object literal that is used in dispatching among other things
     */
    getJSendFailObject:function (response, options) {
      return {data:response.data, message:response.message};
    },

    /**
     * Provides an opportunity to adjust the data that will be used in event dispatching or other similar response mechanisms
     * If you use particular codes or something else in your response this would be the method to override to provide that information
     *
     * The default is to only provide the required and optional keys as defined by JSend minus the status
     *
     * NOTE: I'm not convinced this is needed
     *
     * @param response
     * @param options
     */
    getJSendErrorObject:function (response, options) {
      return {data:response.data, message:response.message, code:response.code};
    },


    /////// METHODS AND HANDLERS IN-PROGRESS ////////
    handleSLValidationFail:function (event) {
      //TODO Write the default validation hook
    },
    /**
     * Currently, because we are using options to "pass around" the original ajax information from Backbone.sync
     *    this method allows us to simply get the "status" and "xhr" from the original Backbone.sync response
     *
     * @param options
     */
    _getSyncData: function(options) {
      return {
        status: options.__syncData ? options.__syncData.status :"",
        xhr:    options.__syncData ? options.__syncData.xhr : ""
      };
    },
    /**
     * Currently, because we are using options to "pass around" the original ajax information from Backbone.sync
     *    this method provides us the ability to simply remove the property
     *
     * @param options
     */
    _cleanOptions: function(options) {
      if(options.__syncData){
        delete options.__syncData;
      }
    }
  };

  // Not sure how I feel about doing this in here.
  //    However, it does make it extremely convenient if there is only one instance of Backbone
  Backbone.JSend = {
    name: "Backbone.JSend",
    sync: JSendSync,
    ResponseMixin: JSendResponseMixin
  };
}).call(window);