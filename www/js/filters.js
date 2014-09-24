angular
  .module('rcs')
  .filter('makeOrderGroup', makeOrderGroup);

function makeOrderGroup () {
  return function (orderItems, menuItems) {
    if (!orderItems) {
      return [];
    }

    if (!menuItems) {
      return orderItems;
    }

    var tempOrderGroup = [];

    for (var i = orderItems.length - 1; i >= 0; i--) {
      var itemId = orderItems[i];

      if (tempOrderGroup[itemId]) {
        tempOrderGroup[itemId].count++;
      } else {
        for (var j = menuItems.length - 1; j >= 0; j--) {
          if (menuItems[j].id == itemId) {
            tempOrderGroup[itemId] = {
              id: menuItems[j].id,
              name: menuItems[j].Name,
              type: menuItems[j].Type,
              price: menuItems[j].Price,
              premiumPrice: menuItems[j].PremiumPrice,
              alias: menuItems[j].Alias,
              count: 1
            };
            break;
          }
        }
      }
    }

    var orderGroup = [];
    for (var i = tempOrderGroup.length - 1; i >= 0; i--) {
      if (angular.isDefined(tempOrderGroup[i])) {
        orderGroup.push(tempOrderGroup[i]);
      }
    }

    return orderGroup;
  }
}