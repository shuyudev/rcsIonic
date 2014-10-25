angular
  .module('rcs')
  .directive('rcsMenuItem', ['rcsSession', rcsMenuItem])
  .directive('rcsNumberInput', [rcsNumberInput]);

function rcsMenuItem (rcsSession) {
  return {
    link: link,
    restrict: 'E',
    templateUrl: 'template/directive-rcsMenuItem.html',
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
      if ($scope.justClickedConfirm) return;
      rcsSession.increaseMenuItemSelection($scope.menuItem.id);
    }
  }
}

function rcsNumberInput () {
  return {
    link: link,
    restrict: 'E',
    templateUrl: 'template/directive-rcsNumberInput.html',
    require: 'ngModel',
    replace: false
  };

  function link ($scope, $element, $attrs, $ngModel) {
    // scope fields
    $scope.numberRows = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]]

    // scope methods
    $scope.clickBackspace = clickBackspace;
    $scope.clickClear = clickClear;
    $scope.clickNumber = clickNumber;

    // locals
    var numberText = '';

    // initialize

    // defines
    function clickBackspace () {
      if (numberText == '') return;

      numberText = numberText.substring(0, numberText.length - 1);
      $ngModel.$setViewValue(parseInt(numberText));
    }

    function clickClear () {
      numberText = '';
      $ngModel.$setViewValue(parseInt(numberText));
    }

    function clickNumber (number) {
      numberText = numberText + number;
      $ngModel.$setViewValue(parseInt(numberText));
    }
  }
}