angular
  .module('rcs')
  .factory('rcsHttp', ['$http', '$log', rcsHttp])
  .factory('rcsSession', ['rcsHttp', rcsSession]);

function rcsSession (rcsHttp) {
  var sessionService = {
    getMode: getMode,
    getSelectedRestaurant: getSelectedRestaurant,
    getSignedInUser: getSignedInUser,
    getTableStatus: getTableStatus,
    handshake: handshake,
    selectRestaurant: selectRestaurant,
    signIn: signIn,
    signOut: signOut,
    unselectRestaurant: unselectRestaurant
  }

  // locals
  var selectedRestaurant = null;
  var signedInUser = null;
  var table = null;
  var token = null;

  // defines
  function handshake () {
    return rcsHttp.User.handshake()
      .success(function (res) {
        signedInUser = null;
        if (res) {
          signedInUser = res;
        }
      });
  }

  function getSelectedRestaurant () {
    return selectedRestaurant;
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

  function selectRestaurant (restaurant, successAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    selectedRestaurant = restaurant;

    successAction();
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

  function signOut (successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.User.signOut()
      .success(function () {
        signedInUser = null;
        successAction();
      })
      .error(errorAction);
  }

  function unselectRestaurant (successAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    selectedRestaurant = null;

    successAction();
  }

  return sessionService;
}

function rcsHttp ($http, $log) {
  var baseUrl = 'http://nodeserver3.cloudapp.net:1337/';
  // var baseUrl = 'http://localhost:1337/';
  var httpService = {};

  var errorAction = function (data, status) {
    $log.debug(data || 'request failed');
    alert(data || 'request failed');
    if (status == 403) {
      // $rootScope.$emit(RCS_EVENT.forbidden);
      // $state.go('page.signin');
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
    },
    handshake: function () {
      return $http
        .post(baseUrl + 'User/handshake')
        .error(errorAction);
    }
  }

  httpService.Restaurant = {
    list: function () {
      return $http
        .post(baseUrl + 'Restaurant/list')
        .error(errorAction);
    }
  }

  httpService.Table = {
    list: function (restaurantId) {
      return $http
        .post(baseUrl + 'Table/list', {
          RestaurantId: restaurantId
        })
        .error(errorAction);
    },
    link: function (restaurantId, tableId, deviceId) {
      return $http
        .post(baseUrl + 'Table/link/' + tableId, {
          RestaurantId: restaurantId,
          LinkedTabletId: deviceId
        })
        .error(errorAction);
    }
  }

  return httpService;
}