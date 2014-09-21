angular.module('rcs', [
  'ionic',
  'ngCordova',
  'ngMaterial',
  'ui.router'
])
.config([
  '$urlRouterProvider',
  '$stateProvider',
  '$httpProvider',
  config
])
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

function config ($urlRouterProvider, $stateProvider, $httpProvider) {
  // to make "credentialed" requests that are cognizant of HTTP Cookies and HTTP Authentication information
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials
  // http://stackoverflow.com/questions/22372377/angularjs-http-post-withcredentials-fails-with-data-in-request-body
  $httpProvider.defaults.withCredentials = true;

  // default route
  $urlRouterProvider.otherwise('/about');

  // states
  $stateProvider
    .state('page', {
      abstract: true,
      templateUrl: 'template/page.html',
      controller: 'pageCtrl',
      resolve: {
        handshake: function (rcsSession) {
          return rcsSession.handshake().then(null, function handleError () {
            // just to make a promise
          });
        }
      }
    })

    // children of page
    .state('page.manage', {
      abstract: true,
      templateUrl: 'template/page-manage.html'
    })
    .state('page.use', {
      abstract: true,
      templateUrl: 'template/page-use.html'
    })

    // children of manage
    .state('page.manage.signin', {
      url: '/manage/signin',
      templateUrl: 'template/page-manage-signin.html',
      controller: 'signInCtrl',
    })
    .state('page.manage.restaurant', {
      url: '/manage/restaurant',
      templateUrl: 'template/page-manage-restaurant.html',
      controller: 'restaurantCtrl',
    })
    .state('page.manage.table', {
      url: '/manage/table',
      templateUrl: 'template/page-manage-table.html',
      controller: 'tableCtrl',
    })

    // children of use
    .state('page.use.about', {
      url: '/about',
      templateUrl: 'template/page-use-about.html',
      controller: 'aboutCtrl'
    });
}