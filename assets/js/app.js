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



    //google signIn
    $scope.auth = {
      signedIn: false
    };

    // Here we do the authentication processing and error handling.
    // Note that authResult is a JSON object.
    $scope.processAuth = function(authResult) {
        // Do a check if authentication has been successful.
        if(authResult['status']['signed_in']) {
            // Successful sign in.
            $scope.auth.signedIn = true;

            //     ...
            // Do some work [1].
            //     ...
        } else if(authResult['error']) {
            // Error while signing in.
            $scope.auth.signedIn = false;
            console.log('Sign-in state: ' + authResult['error']);
            // Report error.
        }
    };

    $scope.signInCallback = function(authResult) {
        $scope.$apply(function() {
          $scope.processAuth(authResult);
          $scope.getMe();
        });
    };
    $scope.renderSignInButton = function() {
      gapi.signin.render('signInButton',
          {
              'callback': $scope.signInCallback, // Function handling the callback.
              'clientid': '745107026144-m21vqtv13v70eabpto9mc8ajqh8p9tec.apps.googleusercontent.com', // CLIENT_ID from developer console which has been explained earlier.
              'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email',
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
           $scope.auth.profile = resp;
         });

       });
      });
    }

    $scope.renderSignInButton();


  });