angular
  .module('rcs')
  .controller('pageCtrl', ['$scope', '$state', 'rcsSession', pageCtrl])
  .controller('signInCtrl', ['$scope', '$state', 'rcsSession', '$http', signInCtrl])
  .controller('restaurantCtrl', ['$scope', '$state', restaurantCtrl])
  .controller('tableCtrl', ['$scope', '$state', tableCtrl])
  .controller('aboutCtrl', ['$scope', '$state', 'rcsSession', 'TABLE_STATUS', aboutCtrl]);

function pageCtrl ($scope, $state, rcsSession) {
  // scope fields
  // scope methods
  // locals

  // initialize
  var mode = rcsSession.getMode();
  if (mode == 'use') {
    return $state.go('page.use.about');
  }
  if (mode == 'manage') {
    return $state.go('page.manage.signin');
  }
}

function signInCtrl ($scope, $state, rcsSession, $http) {
  // scope fields
  $scope.signIn = {
    email: '',
    password: ''
  };

  // scope methods
  $scope.clickSignIn = clickSignIn;

  // defines
  function clickSignIn () {
    rcsSession.signIn(
      $scope.signIn.email,
      $scope.signIn.password,
      function () {
        $state.go('page.manage.restaurant');
      },
      function () {
        alert('login failed');
      });
  }
}

function restaurantCtrl ($scope, $state) {
  // body...
}

function tableCtrl ($scope, $state) {
  // body...
}

function aboutCtrl ($scope, $state, rcsSession, TABLE_STATUS) {
  // scope fields
  // scope methods
  // locals

  // initialize
  var tableStatus = rcsSession.getTableStatus();

  switch(tableStatus) {
    case TABLE_STATUS.ordering:
      return $state.go('page.use.menu');
    case TABLE_STATUS.ordered:
      return $state.go('page.use.eating');
    case TABLE_STATUS.paying:
      return $state.go('page.use.payment');
  }
}
