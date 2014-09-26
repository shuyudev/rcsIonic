angular
  .module('rcs')
  .controller('pageCtrl', ['$scope', '$materialDialog', pageCtrl])
  .controller('pageManageCtrl', ['$scope', '$state', 'rcsSession', pageManageCtrl])
  .controller('pageUseCtrl', ['$scope', '$state', '$interval', 'rcsSession', pageUseCtrl])
  .controller('signInCtrl', ['$scope', '$state', '$timeout', 'rcsSession', 'RCS_REQUEST_ERR', signInCtrl])
  .controller('restaurantCtrl', ['$scope', '$state', 'rcsHttp', 'rcsSession', restaurantCtrl])
  .controller('tableCtrl', ['$scope', '$state', '$cordovaDevice', '$materialDialog', 'rcsHttp', 'rcsSession', tableCtrl])
  .controller('aboutCtrl', ['$scope', '$state', 'rcsSession', 'TABLE_STATUS', aboutCtrl])
  .controller('menuCtrl', ['$rootScope', '$scope', '$state', 'rcsSession', 'RCS_EVENT', 'RCS_REQUEST_ERR', menuCtrl])
  .controller('eatingCtrl', ['$rootScope', '$scope', '$state', 'rcsSession', 'RCS_EVENT', 'RCS_REQUEST_ERR', eatingCtrl]);

function requestErrorAction (res, handler) {
  // when the error is not defined, or when there is no handler, or when it is not handled
  if (!res.status || !angular.isFunction(handler) || !handler()) {
    alert('request failed');
  }
}

function pageCtrl ($scope, $materialDialog) {
  // scope methods
  $scope.simpleDialog = simpleDialog;

  // defines
  function simpleDialog (textId, dissmissAction) {
    if (!angular.isFunction(dissmissAction)) {
      dissmissAction = function () {};
    }

    $materialDialog({
      templateUrl: 'template/dialog-message.html',
      clickOutsideToClose: true,
      escapeToClose: true,
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
  $scope.clickRestaurant = clickRestaurant;
  $scope.clickUser = clickUser;
  $scope.getCurrentRestaurant = getCurrentRestaurant;
  $scope.getCurrentUser = getCurrentUser;

  // locals
  // initialize
  // defines
  function clickRestaurant () {
    return $state.go('page.manage.restaurant', {location: 'replace'});
  }

  function clickUser () {
    return $state.go('page.manage.signin', {location: 'replace'});
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
  $scope.clickReturn = clickReturn;
  $scope.getOrdered = getOrdered;
  $scope.ifShowCall = ifShowCall;
  $scope.ifShowEating = ifShowEating;
  $scope.ifShowOrdered = ifShowOrdered;
  $scope.ifShowReturn = ifShowReturn;

  // locals
  var refresh = $interval(function() {
    $scope.time = new Date();
  }, 1000*30)

  // initialize
  // defines
  function clickReturn () {
    return $state.go($state.previous.state.name);
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

  function ifShowReturn () {
    // disable go back for about and eating page
    if ($state.current.name == 'page.use.about' || $state.current.name == 'page.use.eating') {
      return false;
    }

    if (!$state.previous || $state.previous.state.abstract) {
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
  function clickSignIn () {
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
                $scope.simpleDialog(0);
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
    $state.go('page.manage.restaurant', {location: 'replace'});
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

  // scope methods
  $scope.clickGoTo = clickGoTo;
  $scope.clickRestaurant = clickRestaurant;
  $scope.ifDisableCickGoto = ifDisableCickGoto;

  // locals
  // initialize
  if (!rcsSession.getSignedInUser()) {
    return $state.go('page.manage.signin', {location: 'replace'});
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
        $state.go('page.manage.table', {location: 'replace'});
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
  $scope.tables = null;
  $scope.selectedIndex = -1;
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
    return $state.go('page.manage.restaurant', {location: 'replace'});
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
      function error (argument) {
        // TODO: show link error
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

function aboutCtrl ($scope, $state, rcsSession, TABLE_STATUS) {
  // scope fields
  $scope.table = rcsSession.getSelectedTable();

  // scope methods
  $scope.clickStartOrder = clickStartOrder;
  $scope.ifHideClickStartOrder = ifHideClickStartOrder;

  // locals
  // initialize
  if (!$scope.table) {
    return $state.go('page.manage.signin', {location: 'replace'});
  }

  switch($scope.table.Status) {
    case TABLE_STATUS.ordering:
    case TABLE_STATUS.ordered:
      return $state.go('page.use.eating', {location: 'replace'});
    case TABLE_STATUS.paying:
      return $state.go('page.use.payment', {location: 'replace'});
  }

  // defines
  function clickStartOrder () {
    return $state.go('page.use.menu', {location: 'replace'});
  }

  function ifHideClickStartOrder () {
    return !$scope.table || $scope.table.Status == TABLE_STATUS.paid;
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

  var pageRowLimit = 3;

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

  function clickConfirm () {
    rcsSession.requestOrder(function success () {
      $state.go('page.use.about');
    }, function error (res) {
      requestErrorAction(res, function () {
        switch (res.status) {
          case RCS_REQUEST_ERR.rcsPendingOrder:
            $scope.simpleDialog(1);
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
    $scope.maxPage = Math.floor(menuItemsRowsAll.length / pageRowLimit);

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

function eatingCtrl ($rootScope, $scope, $state, rcsSession, RCS_EVENT, RCS_REQUEST_ERR) {
  // scope fields
  $scope.menuItems = null;
  $scope.ordered = [];
  $scope.orderedGroup = null;
  $scope.refreshing = false;

  // scope methods
  $scope.clickGoToOrder = clickGoToOrder;
  $scope.clickRefresh = clickRefresh;

  // locals
  var makeOrderGroupFilter = makeOrderGroup();

  // events
  // initialize
  initializeOrdered();

  // defines
  function initializeOrdered () {
    $scope.ordered = rcsSession.getSelectedTable().OrderItems;

    // group the order to show count
    $scope.orderedGroup = makeOrderGroupFilter($scope.ordered, rcsSession.getMenuItems());
  }

  function clickGoToOrder () {
    $state.go('page.use.menu');
  }

  function clickRefresh () {
    $scope.refreshing = true;
  }
}