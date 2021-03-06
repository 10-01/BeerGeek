angular.module('app')

.provider('ParseUtils', function(){
  'use strict';
  var credentials = {
    applicationId: null,
    restApiKey: null
  };

  this.initialize = function(applicationId, restApiKey) {
    credentials.applicationId = applicationId;
    credentials.restApiKey = restApiKey;
  };

  this.$get = ['$http', '$q', 'CrudRestUtils', 'Utils', function($http, $q, CrudRestUtils, Utils){
    var service = {
      createCrud: createCrud,           // (objectUrl, _processBreforeSave, _useCache)      create an angular service to interract with Parse (see CrudRestUtils)
      createUserCrud: createUserCrud,   // (sessionToken, _processBreforeSave, _useCache)   create an angular service to interract with Parse User object
      signup: signup,                   // (user)                                           signup new user in parse. User MUST contain username & password fields !
      login: login,                     // (username, password)                             login existing user
      passwordRecover: passwordRecover, // (email)                                          send user password reset
      geoPoint: geoPoint,               // (lat, lon)                                       create a Parse GeoPoint
      toPointer: toPointer,             // (className, objectId)                            create a Parse Pointer
      toDate: toDate                    // (date)                                           format date for Parse
    };
    var parseUrl = 'https://api.parse.com/1';
    var parseObjectKey = 'objectId';
    var getParseData = function(result){
      if(result && result.data){
        if(!result.data[parseObjectKey] && result.data.results){
          return result.data.results;
        } else {
          return result.data;
        }
      }
    };
    var parseHttpConfig = {
      headers: {
        'X-Parse-Application-Id': credentials.applicationId,
        'X-Parse-REST-API-Key': credentials.restApiKey
      }
    };

    function createCrud(objectClass, _processBreforeSave, _useCache){
      // objectClass should by like : MyObject
      var endpointUrl = parseUrl+'/classes/'+objectClass;
      return CrudRestUtils.createCrud(endpointUrl, parseObjectKey, getParseData, _processBreforeSave, _useCache, parseHttpConfig);
    }

    function createUserCrud(sessionToken, _processBreforeSave, _useCache){
      var endpointUrl = parseUrl+'/users';
      var parseUserHttpConfig = angular.copy(parseHttpConfig);
      parseUserHttpConfig.headers['X-Parse-Session-Token'] = sessionToken;

      var service = CrudRestUtils.createCrud(endpointUrl, parseObjectKey, getParseData, _processBreforeSave, _useCache, parseUserHttpConfig);
      service.savePartial = function(user, dataToSave){
        var toSave = angular.copy(dataToSave);
        toSave[parseObjectKey] = user[parseObjectKey];
        return service.save(toSave);
      };
      return service;
    }

    // user MUST have fields 'username' and 'password'. The first one should be unique, application wise.
    function signup(user){
      if(user && user.username && user.password){
        return $http.post(parseUrl+'/users', user, parseHttpConfig).then(function(result){
          var newUser = angular.copy(user);
          delete newUser.password;
          newUser.objectId = result.data.objectId;
          newUser.sessionToken = result.data.sessionToken;
          return newUser;
        });
      } else {
        return $q.reject({data: {error: 'user MUST have fields username & password !'}});
      }
    }

    function login(username, password){
      return $http.get(parseUrl+'/login?username='+encodeURIComponent(username)+'&password='+encodeURIComponent(password), parseHttpConfig).then(function(result){
        return result.data;
      });
    }

    function passwordRecover(email){
      return $http.post(parseUrl+'/requestPasswordReset', {email: email}, parseHttpConfig).then(function(){
        // return nothing
      });
    }

    function geoPoint(lat, lon){
      return {
        __type: 'GeoPoint',
        latitude: lat,
        longitude: lon
      };
    }

    function toPointer(className, objectId){
      return {
        __type: 'Pointer',
        className: className,
        objectId: (typeof objectId === 'object' ? objectId[parseObjectKey] : objectId)
      };
    }

    function toDate(date){
      var d = Utils.toDate(date);
      if(d){
        return d.toISOString();
      }
      throw "Function toDate must be used with a timestamp or a Date object";
    }

    return service;
  }];
});
