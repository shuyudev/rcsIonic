angular
  .module('rcs')
  .factory('rcsLocalstorage', ['$window', rcsLocalstorage])
  .factory('rcsHttp', ['$http', '$log', rcsHttp])
  .factory('rcsSession', ['$rootScope', 'rcsLocalstorage', 'rcsHttp', 'RCS_EVENT', 'STORAGE_KEY', rcsSession]);

function rcsSession ($rootScope, rcsLocalstorage, rcsHttp, RCS_EVENT, STORAGE_KEY) {
  var sessionService = {
    downloadMenu: downloadMenu,
    getMenuItems: getMenuItems,
    getOrdering: getOrdering,
    getSelectedRestaurant: getSelectedRestaurant,
    getSelectedTable: getSelectedTable,
    getSignedInUser: getSignedInUser,
    handshake: handshake,
    linkTable: linkTable,
    increaseMenuItemSelection: increaseMenuItemSelection,
    decreaseMenuItemSelection: decreaseMenuItemSelection,
    selectRestaurant: selectRestaurant,
    signIn: signIn,
    signOut: signOut,
    unselectRestaurant: unselectRestaurant,
    requestOrder: requestOrder
  }

  // locals
  var ordering = [];
  var menuItems = null;
  var signedInUser = null;
  var selectedRestaurant = null;
  var selectedTable = null;
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
        .success(function (res) {
          selectedTable = res.Table;
          menuItems = res.Menu;
        })
        .error(function () {
          // clear session & storage
          // TODO: only do it for match mismatch
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

  function downloadMenu (successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Restaurant.downloadMenu(linkedTableRestaurantId, linkedTableId, linkedTableToken)
      .success(function (res) {
        var menuItems = res.Menu;

        successAction();
      })
      .error(errorAction);
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

        rcsHttp.Table.validateToken(linkedTableRestaurantId, linkedTableId, linkedTableToken)
          .success(function (res) {
            selectedTable = res.Table;
            menuItems = res.Menu;
            // save to storage
            rcsLocalstorage.set(STORAGE_KEY.tableId, linkedTableId);
            rcsLocalstorage.set(STORAGE_KEY.tableToken, linkedTableToken);
            rcsLocalstorage.set(STORAGE_KEY.tableRestaurantId, linkedTableRestaurantId);

            successAction();
          })
          .error(errorAction);
      })
      .error(errorAction);
  }

  function getMenuItems () {
    return angular.copy(menuItems);
  }

  function getOrdering () {
    return angular.copy(ordering);
  }

  function getSelectedRestaurant () {
    return selectedRestaurant;
  }

  function getSignedInUser () {
    return signedInUser;
  }

  function selectRestaurant (restaurant, successAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    selectedRestaurant = restaurant;

    successAction();
  }

  function increaseMenuItemSelection (menuItemId) {
    ordering.push(menuItemId);
    $rootScope.$emit(RCS_EVENT.orderingUpdate);
  }

  function decreaseMenuItemSelection (menuItemId) {
    for (var i = ordering.length - 1; i >= 0; i--) {
      if (ordering[i] == menuItemId) {
        ordering.splice(i, 1);
        break;
      }
    }
    $rootScope.$emit(RCS_EVENT.orderingUpdate);
  }

  function getSelectedTable () {
    return selectedTable;
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

  function requestOrder (successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Request.createOrder(linkedTableRestaurantId, linkedTableId, linkedTableToken, ordering)
      .success(function (res) {
        ordering = [];
        selectedTable = res.setTable;
        successAction(res);
      })
      .error(function (res) {
        errorAction(res);
      });
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
    },
    downloadMenu: function (restaurantId, tableId, token) {
      return $http
        .post(baseUrl + 'Restaurant/downloadMenu', {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token
        })
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

  httpService.Request = {
    createOrder: function (restaurantId, tableId, token, orderItems) {
      return $http
        .post(baseUrl + 'Request/create', {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token,
          Type: 'order',
          OrderItems: orderItems
        })
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