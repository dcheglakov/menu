'use strict';

angular.module("OldCityMenu", ['ui.bootstrap'])
  .service('gUserInfoService', function($q, $timeout){
    var storage = {};
    return {
      get: function (gId) {
        var deferred = $q.defer();
        if (gId in storage) {
          deferred.resolve(storage[gId]);
        }
        else {
          gapi.client.load('plus', 'v1', function () {
            var request = gapi.client.plus.people.get({
              'userId': gId
            });
            $timeout(function() {
              request.execute(function (resp) {
                //$scope.$apply(function(){
                if (resp['error'] == undefined) {
                  storage[gId] = resp;
                  deferred.resolve(resp);
                }
                else {
                  deferred.reject();
                }
                //});

              });
            }, 1000, false);
          });
        }
        return deferred.promise;
      }
    }
  })
  .directive("gUserInfo", function (gUserInfoService) {
    return {
      templateUrl: "assets/templates/gUserInfo.html",
      restrict: 'EA',
      scope: { id:'@gId'},
      link: function postLink($scope, ngModel) {
        gUserInfoService.get($scope.id).then(function(data){
          $scope.model = data;
        });
      }
    };
  })
  .service('gapiApps', function(){
    return {
      'localhost': '745107026144-m21vqtv13v70eabpto9mc8ajqh8p9tec.apps.googleusercontent.com',
      'dcheglakov.com': '745107026144-mg8hd3coa8gckgh1keoclklqsj77jhou.apps.googleusercontent.com',
      '192.168.1.156' : '745107026144-8bqqkqm4l578fbpbukjp7du6s4mbhg1k.apps.googleusercontent.com'
    }
  })
  .service('apiSerivce', function($http){
    var _baseUrl = 'api/service.php?_url=';
    function getUrl(url){
      return _baseUrl + url;
    }

    return {
      getMenu: function(gId){
        return $http.get(getUrl('/menu/'+gId));
      },
      saveDayMenu: function(gId, id, date, categoryId, priceId, itemId){
        return $http.post(getUrl(['/menu/', gId].join('')), {id: id, date: date, categoryId: categoryId, priceId: priceId, itemId: itemId});
      },
      saveOrder: function(date, orders){
        return $http.post(getUrl(['/order/', date].join('')), orders);
      }
    }

  })
  .controller("WeekMenuCtrl", function($scope, $http, $location, gapiApps, apiSerivce, gUserInfoService){
    $scope.weekItems = [];
    $scope.menuItems = [];
    $scope.menuPrices = [];

    $scope.getDayOrderString = function(dayItems){
      var s = [];
      angular.forEach($scope.menuPrices, function(value, key)
      {
        if(dayItems.menu[key].order.quantity > 0){
          s.push([dayItems.menu[key].order.quantity, ' * ', value].join(''));
        }
      });
      return s.join(' + ');
    };

    $scope.getOrderString = function(userOrders){
      var s = [];
      angular.forEach($scope.menuPrices, function(value, key)
      {
        if(key in userOrders && userOrders[key] > 0){
          s.push([userOrders[key], ' * ', value].join(''));
        }
      });
      return s.join(' + ');
    };

    $scope.getDayOrderCost = function(dayItems){
      var s = 0;
      angular.forEach($scope.menuPrices, function(value, key)
      {
        if(dayItems.menu[key].order.quantity > 0){
          s += dayItems.menu[key].order.quantity * value;
        }
      });
      return s;
    };

    $scope.getUserOrderCost = function(userOrders){
      var s = 0;
      angular.forEach($scope.menuPrices, function(value, key)
      {
        if(userOrders[key] > 0){
          s += userOrders[key] * value;
        }
      });
      return s;
    };

    $scope.getTotalDayOrderCost = function(userOrders){
      var s = 0;

      angular.forEach(userOrders, function(userOrder, userId)
      {
        angular.forEach(userOrder.orders, function(quantity, priceId) {
          if (quantity > 0) {
            s += quantity * $scope.menuPrices[priceId];
          }
        });
      });
      return s;
    };

    $scope.getTotalDayOrderString = function(userOrders){
      var prices = [];
      var s = [];
      angular.forEach(userOrders, function(userOrder, userId)
      {
        angular.forEach(userOrder.orders, function(quantity, priceId) {
          if (quantity > 0) {
            if(!(priceId in prices)){
              prices[priceId] = quantity;
            }
            else{
              prices[priceId] += quantity;
            }
          }
        });
      });
      angular.forEach(prices, function(quantity, priceId){
        s.push([quantity, ' * ', $scope.menuPrices[priceId]].join(''));
      });
      return s.join(' + ');
    };

    $scope.getWeekMenuItems = function(){
      $http.get('menu_items.json')
       .then(function(dicts){
        $scope.menuItems = dicts.data["menu"];
        $scope.menuPrices = dicts.data["prices"];

        apiSerivce.getMenu($scope.auth.profile.id)
             .then(function(res){
                var dayIndex = (new Date()).getDay();
                $scope.weekItems.length = 0;
                angular.extend($scope.weekItems, res.data);
                $scope.weekItems[dayIndex-1].isOpen = true;

                angular.forEach($scope.weekItems, function(value, key){
                  var date = new Date(value.date*1000);
                  value.dateStr = date.toLocaleDateString();
                });
              });
      });
    };

    $scope.updateOrder = function(dayItems){
      var orders = [];
      angular.forEach(dayItems.menu, function(value, key){
        var order = {};
        order.id = value.order.id;
        order.date = dayItems.date;
        order.priceId = value.priceId;
        order.userId = $scope.auth.profile.id;
        order.quantity = value.order.quantity;
        orders.push(order);
      });
      apiSerivce.saveOrder(dayItems.date, orders).then(function(resp){
        dayItems.orderSaved = true;
        for (var prop in dayItems.orders) {
          if(!(prop in resp.data)){
            delete dayItems.orders[prop];
          }
        }
        angular.extend(dayItems.orders, resp.data);
      });
    };

    $scope.saveDayMenu = function(id, date, categoryId, priceId, itemId){
      apiSerivce.saveDayMenu($scope.auth.profile.id, id, date, categoryId, priceId, itemId)
    };

    //google signIn
    $scope.auth = {
      signedIn: false
    };

    $scope.processAuth = function(authResult) {
        if(authResult['status']['signed_in']) {
            $scope.getMe();
        } else if(authResult['error']) {
            // Error while signing in.
            //$scope.auth.signedIn = false;
            console.log('Sign-in state: ' + authResult['error']);
            // Report error.
        }
    };

    $scope.signInCallback = function(authResult) {
        $scope.$apply(function() {
          $scope.processAuth(authResult);
        });
    };

    $scope.renderSignInButton = function() {
      gapi.signin.render('signInButton',
          {
              'callback': $scope.signInCallback, // Function handling the callback.
              'clientid': gapiApps[$location.host()], // CLIENT_ID from developer console which has been explained earlier.
              'scope': 'profile https://www.googleapis.com/auth/userinfo.email',
              'cookiepolicy': 'single_host_origin'
          }
      );
    };

    $scope.getMe = function(){
      gUserInfoService.get('me').then(function(resp) {
           if(resp['error'] == undefined) {
             $scope.auth.signedIn = true;
             $scope.auth.profile = resp;
           }

       });
    };

    $scope.renderSignInButton();


    $scope.$watch('auth.signedIn', function(value){
      if(value){
        $scope.getWeekMenuItems();
      }
    });

  });