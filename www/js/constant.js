angular
  .module('rcs')
  .constant('TABLE_STATUS', {
    empty: 'empty',
    emptyText: '空桌',
    ordering: 'ordering',
    orderingText: '正在点菜',
    ordered: 'ordered',
    orderedText: '正在用餐',
    paying: 'paying',
    payingText: '正在结帐',
    paid: 'paid',
    paidText: '已结帐'
  });