angular
  .module('rcs')
  .factory('rcsLocalstorage', ['$window', rcsLocalstorage])
  .factory('rcsHttp', ['$http', '$log', rcsHttp])
  .factory('rcsSession', ['rcsLocalstorage', 'rcsHttp', 'STORAGE_KEY', rcsSession]);
;

function rcsSession (rcsLocalstorage, rcsHttp, STORAGE_KEY) {
  var sessionService = {
    getMode: getMode,
    getSelectedRestaurant: getSelectedRestaurant,
    getSignedInUser: getSignedInUser,
    getTableStatus: getTableStatus,
    handshake: handshake,
    linkTable: linkTable,
    selectRestaurant: selectRestaurant,
    signIn: signIn,
    signOut: signOut,
    unselectRestaurant: unselectRestaurant
  }

  // locals
  var signedInUser = null;
  var selectedRestaurant = null;
  var linkedTableId = null;
  var linkedTableToken = null;
  var linkedTableRestaurantId = null;

  // defines
  function handshake () {
    // load info from storage to session
    linkedTableId = rcsLocalstorage.get(STORAGE_KEY.tableId, null);
    linkedTableToken = rcsLocalstorage.get(STORAGE_KEY.tableToken, null);
    linkedTableRestaurantId = rcsLocalstorage.get(STORAGE_KEY.tableRestaurantId, null);

    if (linkedTableId && linkedTableToken && linkedTableRestaurantId) {
      // validate token, doing so will sign out current user
      return rcsHttp.Table.validateToken(linkedTableRestaurantId, linkedTableId, linkedTableToken)
        .error(function (argument) {
          // clear session & storage
          linkedTableRestaurantId = null;
          linkedTableId = null;
          linkedTableToken = null;
          rcsLocalstorage.clear(STORAGE_KEY.tableId);
          rcsLocalstorage.clear(STORAGE_KEY.tableToken);
          rcsLocalstorage.clear(STORAGE_KEY.tableRestaurantId);
        });
    } else {
      // clear session & storage
      linkedTableRestaurantId = null;
      linkedTableId = null;
      linkedTableToken = null;
      rcsLocalstorage.clear(STORAGE_KEY.tableId);
      rcsLocalstorage.clear(STORAGE_KEY.tableToken);
      rcsLocalstorage.clear(STORAGE_KEY.tableRestaurantId);

      // sign out on start to secure user session
      return rcsHttp.User.signOut()
        .success(function (res) {
          signedInUser = null;
        });
    }
  }

  function linkTable (tableId, deviceId, successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Table.link(selectedRestaurant.id, tableId, deviceId)
      .success(function (res) {
        // save to session
        linkedTableId = res.id;
        linkedTableToken = res.Token;
        linkedTableRestaurantId = selectedRestaurant.id;

        // save to storage
        rcsLocalstorage.set(STORAGE_KEY.tableId, linkedTableId);
        rcsLocalstorage.set(STORAGE_KEY.tableToken, linkedTableToken);
        rcsLocalstorage.set(STORAGE_KEY.tableRestaurantId, linkedTableRestaurantId);

        successAction();
      })
      .error(errorAction);
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
    if (linkedTableId && linkedTableToken && linkedTableRestaurantId) {
      // already linked to service
      return 'use';
     } else {
      // not linked to service yet
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
    // alert(data || 'request failed');
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
      restaurantId = parseInt(restaurantId);
      return $http
        .post(baseUrl + 'Table/list', {
          RestaurantId: restaurantId
        })
        .error(errorAction);
    },
    link: function (restaurantId, tableId, deviceId) {
      restaurantId = parseInt(restaurantId);
      tableId = parseInt(tableId);
      return $http
        .post(baseUrl + 'Table/link/' + tableId, {
          RestaurantId: restaurantId,
          LinkedTabletId: deviceId
        })
        .error(errorAction);
    },
    validateToken: function (restaurantId, tableId, token) {
      restaurantId = parseInt(restaurantId);
      tableId = parseInt(tableId);
      return $http
        .post(baseUrl + 'Table/validateToken', {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token
        })
        .error(errorAction);
    }
  }

  return httpService;
}

function rcsLocalstorage ($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    clear: function(key) {
      delete $window.localStorage[key];
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}