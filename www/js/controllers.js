angular
  .module('rcs')
  .controller('pageCtrl', ['$scope', '$state', 'rcsSession', pageCtrl])
  .controller('signInCtrl', ['$scope', '$state', 'rcsSession', signInCtrl])
  .controller('restaurantCtrl', ['$scope', '$state', 'rcsHttp', 'rcsSession', restaurantCtrl])
  .controller('tableCtrl', ['$scope', '$state', 'rcsHttp', 'rcsSession', tableCtrl])
  .controller('aboutCtrl', ['$scope', '$state', 'rcsSession', 'TABLE_STATUS', aboutCtrl]);

function pageCtrl ($scope, $state, rcsSession) {
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
    return $state.go('page.manage.restaurant');
  }

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
  $scope.selectedIndex = -1;

  // scope methods
  $scope.clickGoTo = clickGoTo;
  $scope.clickRestaurant = clickRestaurant;

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
    rcsSession.selectRestaurant($scope.restaurants[$scope.selectedIndex],
      function success () {
        $state.go('page.manage.table');
      });
  }

  function clickRestaurant (index) {
    $scope.selectedIndex = index;
  }
}

function tableCtrl ($scope, $state, rcsHttp, rcsSession) {
  // scope fields
  $scope.tables = null
  // scope methods
  // locals
  // initialize
  if (!rcsSession.getSelectedRestaurant()) {
    return $state.go('page.manage.restaurant');
  }

  // defines
}

function aboutCtrl ($scope, $state, rcsSession, TABLE_STATUS) {
  // scope fields
  // scope methods
  // locals
  // initialize
  clickStartToUse();

  // defines
  function clickStartToUse () {
    if (rcsSession.getMode() == 'manage') {
      return $state.go('page.manage.signin');
    }

    switch(rcsSession.getTableStatus()) {
      case TABLE_STATUS.ordering:
        return $state.go('page.use.menu');
      case TABLE_STATUS.ordered:
        return $state.go('page.use.eating');
      case TABLE_STATUS.paying:
        return $state.go('page.use.payment');
    }
  }
}
