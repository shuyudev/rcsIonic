angular
  .module('rcs')
  .factory('rcsHttp', ['$http', '$log', rcsHttp])
  .factory('rcsSession', ['rcsHttp', rcsSession]);

function rcsSession (rcsHttp) {
  var sessionService = {
    getMode: getMode,
    getSignedInUser: getSignedInUser,
    getTableStatus: getTableStatus,
    handshake: handshake,
    signIn: signIn
  }

  // locals
  var signedInUser = null;
  var table = null;
  var token = null;

  // defines
  function handshake () {
    // token = '123';
    return null;
  }

  function getSignedInUser () {
    return signedInUser;
  }

  function getTableStatus () {
    return 'empty';
  }

  function getMode () {
    if (token) {
      return 'use';
     } else {
      return 'manage'
     }
  }

  function signIn (email, password, successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.User.signIn(email, password)
      .success(function (res) {
        signedInUser = res;
        successAction();
      })
      .error(errorAction);
  }

  return sessionService;
}

function rcsHttp ($http, $log) {
  var baseUrl = 'http://nodeserver3.cloudapp.net:1337/';
  var httpService = {};

  var errorAction = function (data, status) {
    $log.debug(data || 'request failed');
    alert(data || 'request failed');
    if (status == 403) {
      // $rootScope.$emit(RCS_EVENT.forbidden);
      $state.go('page.signin');
    }
  }

  httpService.User = {
    signIn: function (email, password) {

      return $http
        .post(baseUrl + 'User/login', {
          Email: email,
          Password: password
        })
        .error(errorAction);
    },
    signOut: function () {
      return $http
        .post(baseUrl + 'User/logout')
        .error(errorAction);
    }
  }


  return httpService;
}