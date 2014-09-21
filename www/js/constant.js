angular
  .module('rcs')
  .constant('TABLE_STATUS', {
    empty: 'empty',
    ordering: 'ordering',
    ordered: 'ordered',
    paying: 'paying',
    paid: 'paid'
  })
  .constant('STORAGE_KEY', {
    tableToken: 'rcs-table-token',
    tableId: 'rcs-table-id',
    tableRestaurantId: 'rcs-table-restaurantId'
  });