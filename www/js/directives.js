angular
  .module('rcs')
  .directive('rcsMenuItem', ['rcsSession', rcsMenuItem]);

function rcsMenuItem (rcsSession) {
  return {
    link: link,
    restrict: 'E',
    templateUrl: '/template/directive-rcsMenuItem.html',
    replace: false
  };

  function link ($scope, $element, $attrs) {
    // scope fields
    // scope methods
    $scope.clickMenuItem = clickMenuItem;

    // locals
    // initialize

    // defines
    function clickMenuItem () {
      if ($scope.menuItem.selected == false) {
        rcsSession.increaseMenuItemSelection($scope.menuItem.id);
      }
    }
  }
}