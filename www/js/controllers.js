angular
  .module('rcs')
  .controller('pageManageCtrl', ['$scope', '$state', 'rcsSession', pageManageCtrl])
  .controller('pageUseCtrl', ['$scope', '$state', 'rcsSession', pageUseCtrl])
  .controller('signInCtrl', ['$scope', '$state', 'rcsSession', signInCtrl])
  .controller('restaurantCtrl', ['$scope', '$state', 'rcsHttp', 'rcsSession', restaurantCtrl])
  .controller('tableCtrl', ['$scope', '$state', '$cordovaDevice', '$materialDialog', 'rcsHttp', 'rcsSession', tableCtrl])
  .controller('aboutCtrl', ['$scope', '$state', 'rcsSession', 'TABLE_STATUS', aboutCtrl])
  .controller('menuCtrl', ['$rootScope', '$scope', '$state', 'rcsSession', 'RCS_EVENT', menuCtrl]);

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

function pageUseCtrl ($scope, $state, rcsSession) {
  // scope fields
  $scope.table = rcsSession.getSelectedTable();

  // scope methods
  // locals
  // initialize
  // defines
}

function signInCtrl ($scope, $state, rcsSession) {
  // scope fields
  $scope.signIn = {
    email: '',
    password: ''
  };

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
    rcsSession.signIn(
      $scope.signIn.email,
      $scope.signIn.password,
      clickGoToRestaurants,
      function () {
        alert('login failed');
      });
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
      return $state.go('page.use.menu', {location: 'replace'});
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

function menuCtrl ($rootScope, $scope, $state, rcsSession, RCS_EVENT) {
  // scope fields
  $scope.menuItems = null;
  $scope.orderingGroup = null;
  $scope.menuTypes = null;
  $scope.selectedIndex = null;
  $scope.menuItemsRows = null;

  // scope methods
  $scope.clickConfirm = clickConfirm;
  $scope.clickOrderingMinus = clickOrderingMinus;
  $scope.clickOrderingPlus = clickOrderingPlus;
  $scope.clickRefreshMenu = clickRefreshMenu;
  $scope.getMenuItemRows = getMenuItemRows;
  $scope.onTabSelected = onTabSelected;

  // locals
  var makeOrderGroupFilter = makeOrderGroup();
  var ordering = null;

  // events
  $rootScope.$on(RCS_EVENT.orderingUpdate, updateOrdering);

  // initialize
  initializeMenu();

  // defines
  function initializeMenu () {
    $scope.menuItems = rcsSession.getMenuItems();
    $scope.menuTypes = [];

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
      $state.go('page.use.eating');
    });
  }

  function clickOrderingMinus (ordering) {
    rcsSession.decreaseMenuItemSelection(ordering.id);
  }

  function clickOrderingPlus (ordering) {
    rcsSession.increaseMenuItemSelection(ordering.id);
  }

  function clickRefreshMenu () {
    rcsSession.downloadMenu(function success () {
      initializeMenu();
    })
  }

  function getMenuItemRows () {

  }

  function onTabSelected (index) {
    $scope.selectedIndex = index;

    var menuItemsRows = [];
    var row = 0;
    var rowItemLimit = 2;
    var rowItemCount = 0;

    for (var i = $scope.menuItems.length - 1; i >= 0; i--) {
      if (!menuItemsRows[row]) {
        menuItemsRows[row] = [];
      }

      var menuItem = $scope.menuItems[i];
      if (menuItem.Type != $scope.menuTypes[$scope.selectedIndex]) {
        continue;
      }

      menuItemsRows[row].push(menuItem);
      if (++rowItemCount == rowItemLimit) {
        row++;
        rowItemCount = 0;
      }
    };

    $scope.menuItemsRows = menuItemsRows;
  }

  function updateOrdering () {
    ordering = rcsSession.getOrdering();

    // group the order to show count
    $scope.orderingGroup = makeOrderGroupFilter(
      ordering,
      $scope.menuItems);

    // mark if menuItem is selected
    for (var i = 0 ; i < $scope.menuItems.length; i++) {
      var menuItem = $scope.menuItems[i];
      if (ordering.indexOf(menuItem.id) != -1) {
        menuItem.selected = true;
      } else {
        menuItem.selected = false;
      }
    }

  }
}