'use strict';

angular.module("OldCityMenu", ['ui.bootstrap'])
  .directive("itemsNumberPicker", function () {
    return {
      templateUrl: "assets/templates/itemsNumberPicker.html",
      restrict: 'EA',
      require: '?ngModel',
      scope: {},
      link: function postLink($scope, ngModel) {
        $scope.model = $scope.$eval(ngModel.$modelValue);
      }
    };
  })
  .controller("WeekMenuCtrl", function($scope, $http){

    $scope.weekItems = [];
    $scope.menuItems = [];
    $scope.menuPrices = [];

    $http.get('menu_items.json')
       .then(function(dicts){
        $scope.menuItems = dicts.data["menu"];
        $scope.menuPrices = dicts.data["prices"];

        $http.get('sample_menu.json')
             .then(function(res){
                var dayIndex = (new Date()).getDay();
                $scope.weekItems.length = 0;
                angular.extend($scope.weekItems, res.data);
                $scope.weekItems[dayIndex-1].isOpen = true;
              });
      });



  });