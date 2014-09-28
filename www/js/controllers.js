angular
  .module('rcs')
  .controller('pageCtrl', ['$scope', '$state', '$materialDialog', pageCtrl])
  .controller('pageManageCtrl', ['$scope', '$state', 'rcsSession', pageManageCtrl])
  .controller('pageUseCtrl', ['$scope', '$state', '$interval', 'rcsSession', pageUseCtrl])
  .controller('signInCtrl', ['$scope', '$state', '$timeout', 'rcsSession', 'RCS_REQUEST_ERR', signInCtrl])
  .controller('restaurantCtrl', ['$scope', '$state', 'rcsHttp', 'rcsSession', restaurantCtrl])
  .controller('tableCtrl', ['$scope', '$state', '$cordovaDevice', '$materialDialog', 'rcsHttp', 'rcsSession', tableCtrl])
  .controller('aboutCtrl', ['$scope', '$state', '$interval', 'rcsSession', 'TABLE_STATUS', aboutCtrl])
  .controller('menuCtrl', ['$rootScope', '$scope', '$state', 'rcsSession', 'RCS_EVENT', 'RCS_REQUEST_ERR', menuCtrl])
  .controller('eatingCtrl', ['$scope', '$state', 'rcsSession', 'RCS_REQUEST_ERR', eatingCtrl])
  .controller('paymentCtrl', ['$scope', '$state', '$materialDialog', 'rcsSession', 'RCS_REQUEST_ERR', paymentCtrl]);

function requestErrorAction (res, handler) {
  // when the error is not defined, or when there is no handler, or when it is not handled
  if (!res.status || !angular.isFunction(handler) || !handler()) {
    alert('request failed');
  }
}

function pageCtrl ($scope, $state, $materialDialog) {
  // scope methods
  $scope.clickReturn = clickReturn;
  $scope.ifShowReturn = ifShowReturn;
  $scope.simpleDialog = simpleDialog;

  // defines
  function clickReturn () {
    return $state.go($state.previous.state.name);
  }

  function ifShowReturn () {
    // disable go back for about and eating page
    if ($state.current.name == 'page.use.about'
      || $state.current.name == 'page.use.eating'
      || $state.current.name == 'page.manage.signin') {
      return false;
    }

    if (!$state.previous
      || $state.previous.state.abstract
      || $state.previous.state.name == 'page.use.about') {
      return false;
    }

    return true;
  }

  function simpleDialog (textId, dissmissAction, event) {
    if (!angular.isFunction(dissmissAction)) {
      dissmissAction = function () {};
    }

    $materialDialog({
      templateUrl: 'template/dialog-message.html',
      clickOutsideToClose: true,
      escapeToClose: true,
      targetEvent: event,
      controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
        $scope.textId = textId;
        $scope.clickDismiss = clickDismiss;

        function clickDismiss () {
          dissmissAction();
          $hideDialog();
        }
      }]
    });
  }
}

function pageManageCtrl ($scope, $state, rcsSession) {
  // scope fields
  // scope methods
  $scope.clickUser = clickUser;
  $scope.getCurrentRestaurant = getCurrentRestaurant;
  $scope.getCurrentUser = getCurrentUser;

  // locals
  // initialize
  // defines
  function clickUser () {
    return $state.go('page.manage.signin');
  }

  function getCurrentRestaurant () {
    var restaurant = rcsSession.getSelectedRestaurant();
    return restaurant ? restaurant.RestaurantName : null;
  }

  function getCurrentUser () {
    var user = rcsSession.getSignedInUser();
    return user ? user.Name : null;
  }
}

function pageUseCtrl ($scope, $state, $interval, rcsSession) {
  // scope fields
  $scope.table = rcsSession.getSelectedTable();
  $scope.time = new Date();

  // scope methods
  $scope.clickCall = clickCall;
  $scope.clickOrdered = clickOrdered;
  $scope.getOrdered = getOrdered;
  $scope.ifShowCall = ifShowCall;
  $scope.ifShowEating = ifShowEating;
  $scope.ifShowOrdered = ifShowOrdered;

  // locals
  var refresh = $interval(function() {
    $scope.time = new Date();
  }, 1000*30)

  // initialize
  // defines
  function clickCall () {
    return $state.go('page.use.eating');
  }

  function clickOrdered () {
    return $state.go('page.use.eating');
  }

  function getOrdered () {
    return rcsSession.getSelectedTable().OrderItems ? rcsSession.getSelectedTable().OrderItems : [];
  }

  function ifShowCall () {
    // for eating page, the main content would contain it
    if ($state.current.name == 'page.use.eating') {
      return false;
    }
  }

  function ifShowEating () {
    if ($state.current.name != 'page.use.eating') {
      return false;
    }
  }

  function ifShowOrdered () {
    // for eating page, the main content would contain it
    if ($state.current.name == 'page.use.eating') {
      return false;
    }

    if (getOrdered().length == 0) {
      return false;
    }

    return true;
  }
}

function signInCtrl ($scope, $state, $timeout, rcsSession, RCS_REQUEST_ERR) {
  // scope fields
  $scope.signIn = {
    email: '',
    password: ''
  };
  $scope.signingIn = false;

  // scope methods
  $scope.clickGoToRestaurants = clickGoToRestaurants;
  $scope.clickSignIn = clickSignIn;
  $scope.clickSignOut = clickSignOut;
  $scope.getSignedInUser = getSignedInUser;
  $scope.ifSignedIn = ifSignedIn;

  // initialize
  rcsSession.unselectRestaurant();

  // defines
  function clickSignIn (event) {
    if ($scope.signingIn) return;
    if (!$scope.signIn.email || !$scope.signIn.password) return;

    // use timeout in order to show button ink
    $timeout(function () {
      $scope.signingIn = true;
      rcsSession.signIn(
        $scope.signIn.email,
        $scope.signIn.password,
        function success () {
          clickGoToRestaurants();
        },
        function error (res, status) {
          requestErrorAction(res, function () {
            switch (res.status) {
              case RCS_REQUEST_ERR.rcsSignInFail:
                $scope.simpleDialog(0, null, event);
                $scope.signingIn = false;
                return true;
              default:
                return false;
            }
          });
        });
    }, 250);
  }

  function clickGoToRestaurants () {
    $state.go('page.manage.restaurant');
  }

  function clickSignOut () {
    rcsSession.signOut();
  }

  function getSignedInUser () {
    return rcsSession.getSignedInUser();
  }

  function ifSignedIn () {
    return rcsSession.getSignedInUser() != null;
  }
}

function restaurantCtrl ($scope, $state, rcsHttp, rcsSession) {
  // scope fields
  $scope.restaurants = null;
  $scope.selectedIndex = 0;
  $scope.selectedIndexUi = 0;

  // scope methods
  $scope.clickGoTo = clickGoTo;
  $scope.clickRestaurant = clickRestaurant;
  $scope.ifDisableCickGoto = ifDisableCickGoto;

  // locals
  // initialize
  if (!rcsSession.getSignedInUser()) {
    return $state.go('page.manage.signin');
  }

  rcsSession.unselectRestaurant(initializeRestaurants);

  // defines
  function initializeRestaurants () {
    return rcsHttp.Restaurant.list()
      .success(function (res) {
        $scope.restaurants = res.Restaurants;
      });
  }

  function clickGoTo () {
    if ($scope.ifDisableCickGoto()) return;

    rcsSession.selectRestaurant($scope.restaurants[$scope.selectedIndex],
      function success () {
        $state.go('page.manage.table');
      });
  }

  function clickRestaurant (index) {
    $scope.selectedIndex = index;
  }

  function ifDisableCickGoto () {
    return $scope.selectedIndex == -1;
  }
}

function tableCtrl ($scope, $state, $cordovaDevice, $materialDialog, rcsHttp, rcsSession) {
  // scope fields
  $scope.refreshing = false;
  $scope.linking = false;
  $scope.tables = null;
  $scope.selectedIndex = -1;
  $scope.selectedIndexUi = -1;
  $scope.selectedTable = null;
  $scope.deviceModel = null;
  $scope.deviceSystemVersion = null;
  $scope.deviceId = null;

  try {
    // there will be exception when app is not running on real device
    $scope.deviceModel = $cordovaDevice.getModel();
    $scope.deviceSystemVersion = $cordovaDevice.getVersion();
    $scope.deviceId = $cordovaDevice.getUUID();
  } catch (ex) { }

  // scope methods
  $scope.clickLink = clickLink;
  $scope.clickRefreshTable = clickRefreshTable;
  $scope.clickTable = clickTable;
  $scope.ifDisableCickLink = ifDisableCickLink;
  $scope.ifNotLinked = ifNotLinked;

  // locals
  // initialize
  if (!rcsSession.getSelectedRestaurant()) {
    return $state.go('page.manage.restaurant');
  }

  var restaurantId = rcsSession.getSelectedRestaurant().id;

  clickRefreshTable();

  // defines
  function clickRefreshTable () {
    $scope.refreshing = true;

    return rcsHttp.Table.list(restaurantId)
      .success(function (res) {
        $scope.refreshing = false;
        $scope.tables = res.Tables
        $scope.selectedIndex = -1;
        $scope.selectedTable = null;
      });
  }

  function clickLink (event) {
    if ($scope.ifDisableCickLink()) return;
    if ($scope.linking) return;

    $scope.linking = true;

    var table = $scope.selectedTable;

    rcsSession.linkTable(table.id, $scope.deviceId,
      function success () {
        var dialogEditMenuItemType = {
          templateUrl: 'template/dialog-linkSuccess.html',
          clickOutsideToClose: false,
          escapeToClose: false,
          targetEvent: event,
          controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
            $scope.table = table;
            $scope.clickSignout = clickSignout;

            function clickSignout () {
              rcsSession.signOut(function () {
                // start to use
                $state.go('page.use.about')
                $hideDialog();
              });
            }
          }]
        }

        $materialDialog(dialogEditMenuItemType);
      },
      function error (res) {
        requestErrorAction(res);
        $scope.linking = true;
      });
  }

  function clickTable (index, table) {
    $scope.selectedIndex = index;
    $scope.selectedTable = table;
  }

  function ifDisableCickLink () {
    return $scope.selectedIndex == -1 || !$scope.deviceId;
  }

  function ifNotLinked (table) {
    return table.LinkedTabletId == null;
  }
}

function aboutCtrl ($scope, $state, $interval, rcsSession, TABLE_STATUS) {
  // scope fields
  $scope.table = null;
  $scope.justClicked = false;

  // scope methods
  $scope.clickRefresh = clickRefresh;
  $scope.clickStartOrder = clickStartOrder;

  // locals
  // initialize
  initialize();

  // defines
  function initialize () {
    $scope.table = rcsSession.getSelectedTable();

    if (!$scope.table) {
      return $state.go('page.manage.signin');
    }

    switch($scope.table.Status) {
      case TABLE_STATUS.ordering:
      case TABLE_STATUS.ordered:
        return $state.go('page.use.eating');

      case TABLE_STATUS.paying:
        // TODO: $interval to check is pay complete
        break;
      case TABLE_STATUS.paid:
      case TABLE_STATUS.empty:
        break;
    }
  }

  function clickRefresh () {
    if ($scope.justClicked) return;

    $scope.justClicked = true;

    rcsSession.refreshTable(function success () {
      initialize();
      $scope.justClicked = false;
    }, requestErrorAction)
  }

  function clickStartOrder () {
    return $state.go('page.use.menu');
  }
}

function menuCtrl ($rootScope, $scope, $state, rcsSession, RCS_EVENT, RCS_REQUEST_ERR) {
  // scope fields
  $scope.menuItems = null;
  $scope.ordering = null;
  $scope.orderingGroup = null;
  $scope.menuTypes = null;
  $scope.selectedIndex = null;
  $scope.currentPage = null;
  $scope.maxPage = null;
  $scope.menuItemsRows = null;

  // scope methods
  $scope.clickConfirm = clickConfirm;
  $scope.clickOrderingMinus = clickOrderingMinus;
  $scope.clickOrderingPlus = clickOrderingPlus;
  $scope.clickPageNext = clickPageNext;
  $scope.clickPagePrevious = clickPagePrevious;
  $scope.clickRefreshMenu = clickRefreshMenu;
  $scope.onTabSelected = onTabSelected;

  // locals
  var loadPage = loadPage;
  var makeOrderGroupFilter = makeOrderGroup();
  var menuItemsRowsAll = null;

  var pageRowLimit = 4;

  // events
  $rootScope.$on(RCS_EVENT.orderingUpdate, updateOrdering);

  // initialize
  initializeMenu();

  // defines
  function initializeMenu () {
    $scope.menuItems = rcsSession.getMenuItems();
    $scope.menuTypes = [];

    if (!$scope.menuItems) return;

    for (var i = 0 ; i < $scope.menuItems.length; i++) {
      var type = $scope.menuItems[i].Type;
      if ($scope.menuTypes.indexOf(type) == -1) {
        $scope.menuTypes.push(type);
      }
    }

    updateOrdering();

    $scope.selectedIndex = 0;
    onTabSelected($scope.selectedIndex);
  }

  function clickConfirm (event) {
    rcsSession.requestOrder(function success () {
      $state.go('page.use.about');
    }, function error (res) {
      requestErrorAction(res, function () {
        switch (res.status) {
          case RCS_REQUEST_ERR.rcsPendingOrder:
            $scope.simpleDialog(1, null, event);
            return true;
          default:
            return false;
        }
      });
    });
  }

  function clickOrderingMinus (ordering) {
    rcsSession.decreaseMenuItemSelection(ordering.id);
  }

  function clickOrderingPlus (ordering) {
    rcsSession.increaseMenuItemSelection(ordering.id);
  }

  function clickPageNext () {
    if ($scope.currentPage == $scope.maxPage) return;
    $scope.currentPage++;
    loadPage();
  }

  function clickPagePrevious () {
    if ($scope.currentPage == 1) return;
    $scope.currentPage--;
    loadPage();
  }


  function loadPage () {
    var start = ($scope.currentPage - 1) * pageRowLimit;
    $scope.menuItemsRows = menuItemsRowsAll.slice(start, start + pageRowLimit);
  }

  function clickRefreshMenu () {
    rcsSession.downloadMenu(function success () {
      initializeMenu();
    })
  }

  function onTabSelected (index) {
    $scope.selectedIndex = index;

    // refresh menuItemsRowsAll
    var row = 0;
    var rowItemLimit = 2;
    var rowItemCount = 0;

    menuItemsRowsAll = [];
    for (var i = $scope.menuItems.length - 1; i >= 0; i--) {
      if (!menuItemsRowsAll[row]) {
        menuItemsRowsAll[row] = [];
      }

      var menuItem = $scope.menuItems[i];
      if (menuItem.Type != $scope.menuTypes[$scope.selectedIndex]) {
        continue;
      }

      menuItemsRowsAll[row].push(menuItem);
      if (++rowItemCount == rowItemLimit) {
        row++;
        rowItemCount = 0;
      }
    };

    // refresh page count
    $scope.currentPage = 1;
    $scope.maxPage = Math.ceil(menuItemsRowsAll.length / pageRowLimit);

    // load page
    loadPage();
  }

  function updateOrdering () {
    $scope.ordering = rcsSession.getOrdering();

    // group the order to show count
    $scope.orderingGroup = makeOrderGroupFilter(
      $scope.ordering,
      $scope.menuItems);

    // mark if menuItem is selected
    for (var i = 0 ; i < $scope.menuItems.length; i++) {
      var menuItem = $scope.menuItems[i];
      if ($scope.ordering.indexOf(menuItem.id) != -1) {
        menuItem.selected = true;
      } else {
        menuItem.selected = false;
      }
    }

  }
}

function eatingCtrl ($scope, $state, rcsSession, RCS_REQUEST_ERR) {
  // scope fields
  $scope.menuItems = null;
  $scope.ordered = [];
  $scope.orderedGroup = [];
  $scope.refreshing = false;
  $scope.justClicked = {};

  // scope methods
  $scope.clickGoToOrder = clickGoToOrder;
  $scope.clickRefresh = clickRefresh;
  $scope.clickRequest = clickRequest;
  $scope.clickPay = clickPay;
  $scope.getRequestCd = getRequestCd;

  // locals
  var makeOrderGroupFilter = makeOrderGroup();

  // events
  // initialize
  initializeOrdered();
  $scope.justClicked['water'] = false;
  $scope.justClicked['call'] = false;

  // defines
  function initializeOrdered () {
    $scope.ordered = rcsSession.getSelectedTable().OrderItems ? rcsSession.getSelectedTable().OrderItems : [];

    // group the order to show count
    $scope.orderedGroup = makeOrderGroupFilter($scope.ordered, rcsSession.getMenuItems());
  }

  function clickGoToOrder () {
    $state.go('page.use.menu');
  }

  function clickRefresh () {
    if ($scope.refreshing) return;

    $scope.refreshing = true;
    rcsSession.refreshTable(function success () {
      initializeOrdered();
      $scope.refreshing = false;
    }, requestErrorAction)
  }

  function clickRequest (requestType, event) {
    if ($scope.justClicked[requestType] || $scope.getRequestCd(requestType) != 0) return;

    $scope.justClicked[requestType] = true;

    var successAction = function () {
      $scope.justClicked[requestType] = false;
      $scope.simpleDialog(2, null, event);
    }

    return rcsSession.requestWithCd(requestType, successAction, requestErrorAction);
  }

  function clickPay () {
    if ($scope.ordered.length == 0) return;

    return $state.go('page.use.payment');
  }

  function getRequestCd (requestType) {
    return rcsSession.getRequestCd(requestType);
  }
}

function paymentCtrl ($scope, $state, $materialDialog, rcsSession, RCS_REQUEST_ERR) {
  // scope fields
  $scope.menuItems = null;
  $scope.ordered = null;
  $scope.orderedGroup = [];
  $scope.grandTotal = 0;
  $scope.grandTotalPremium = 0;
  $scope.isPremium = false;
  $scope.justClicked = {};

  // scope methods
  $scope.clickPay = clickPay;

  // locals
  var makeOrderGroupFilter = makeOrderGroup();

  // initialize
  $scope.justClicked['cash'] = false;
  $scope.justClicked['card'] = false;

  rcsSession.refreshTable(function success () {
    initializeOrdered();
  }, requestErrorAction);

  // defines
  function initializeOrdered () {
    $scope.ordered = rcsSession.getSelectedTable().OrderItems ? rcsSession.getSelectedTable().OrderItems : [];

    // group the order to show count
    $scope.orderedGroup = makeOrderGroupFilter($scope.ordered, rcsSession.getMenuItems());

    for (var i = $scope.orderedGroup.length - 1; i >= 0; i--) {
      var item = $scope.orderedGroup[i];
      $scope.grandTotal += item.price * item.count;
      $scope.grandTotalPremium += item.premiumPrice * item.count;
    };
  }

  function clickPay (payType, event) {
    if ($scope.justClicked[payType]) return;

    $scope.justClicked[payType] = true;

    var successAction = function () {
      $state.go('page.use.about');
    }

    var errorAction = function (res) {
      $scope.justClicked[payType] = false;
      requestErrorAction(res);
    }

    var shouldPay = $scope.isPremium ? $scope.grandTotalPremium : $scope.grandTotal;
    var isPremium = $scope.isPremium;

    if (payType == 'cash') {
      // ask for cash change
      $materialDialog({
        templateUrl: 'template/dialog-payCash.html',
        clickOutsideToClose: true,
        escapeToClose: true,
        targetEvent: event,
        controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
          // scope fields
          $scope.shouldPay = shouldPay;
          $scope.willPay = 0;
          $scope.numberRows = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]]

          // scope methods
          $scope.clickBackspace = clickBackspace;
          $scope.clickClear = clickClear;
          $scope.clickNeedChange = clickNeedChange;
          $scope.clickNoNeed = clickNoNeed;
          $scope.clickNumber = clickNumber;
          $scope.ifValidPay = ifValidPay;

          // locals
          var willPayText = '';

          // defines
          function clickBackspace () {
            if (willPayText == '') return;

            willPayText = willPayText.substring(0, willPayText.length - 1);
            $scope.willPay = parseInt(willPayText);
          }

          function clickClear () {
            willPayText = '';
            $scope.willPay = parseInt(willPayText);
          }

          function clickNeedChange () {
            if (!$scope.ifValidPay()) return;

            rcsSession.requestPay(isPremium, payType, $scope.willPay, successAction, errorAction);
            $hideDialog();
          }

          function clickNoNeed () {
            rcsSession.requestPay(isPremium, payType, $scope.shouldPay, successAction, errorAction);
            $hideDialog();
          }

          function clickNumber (number) {
            willPayText = willPayText + number;
            $scope.willPay = parseInt(willPayText);
          }

          function ifValidPay () {
            $scope.willPay = parseFloat($scope.willPay);
            if (!angular.isNumber($scope.willPay) || !$scope.willPay || $scope.willPay < $scope.shouldPay) {
              return false;
            }

            return true;
          }
        }]
      });

      $scope.justClicked[payType] = false;
    } else {
      return rcsSession.requestPay($scope.isPremium, payType, shouldPay, successAction, errorAction);
    }
  }
}