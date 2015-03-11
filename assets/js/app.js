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
      }
    }

  })
  .controller("WeekMenuCtrl", function($scope, $http, $location, gapiApps, apiSerivce){
    $scope.weekItems = [];
    $scope.menuItems = [];
    $scope.menuPrices = [];

    $scope.getDayOrderString = function(dayItems){
      var s = [];
      angular.forEach($scope.menuPrices, function(value, key)
      {
        if(dayItems.menu[key].ordered > 0){
          s.push([dayItems.menu[key].ordered, ' * ', value].join(''));
        }
      });
      return s.join(' + ');
    };

    $scope.getDayOrderCost = function(dayItems){
      var s = 0;
      angular.forEach($scope.menuPrices, function(value, key)
      {
        if(dayItems.menu[key].ordered > 0){
          s += dayItems.menu[key].ordered * value;
        }
      });
      return s;
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
      gapi.client.load('plus','v1', function(){
       var request = gapi.client.plus.people.get({
         'userId': 'me'
       });
       request.execute(function(resp) {
         $scope.$apply(function(){
           if(resp['error'] == undefined) {
             $scope.auth.signedIn = true;
             $scope.auth.profile = resp;
           }
         });

       });
      });
    };

    $scope.renderSignInButton();


    $scope.$watch('auth.signedIn', function(value){
      if(value){
        $scope.getWeekMenuItems();
      }
    });

  });