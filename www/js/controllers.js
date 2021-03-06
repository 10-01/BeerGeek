angular.module('app')

.controller('LoginCtrl', function($scope, $state, AuthSrv){
  'use strict';
  var data = {}, fn = {};
  $scope.data = data;
  $scope.fn = fn;

  data.error = null;
  data.loading = false;

  fn.login = function(credentials){
    data.error = null;
    data.loading = true;
    AuthSrv.login(credentials).then(function(){
      $state.go('app.tabs.twitts');
      data.credentials.password = '';
      data.error = null;
      data.loading = false;
    }, function(error){
      data.credentials.password = '';
      data.error = error.data && error.data.message ? error.data.message : error.statusText;
      data.loading = false;
    });
  };
})

.controller('AppCtrl', function($scope, $state, AuthSrv){
  'use strict';
  $scope.logout = function(){
    AuthSrv.logout().then(function(){
      $state.go('login');
    });
  };
})

.controller('TabsCtrl', function($scope, PushPlugin){
  'use strict';
  var data = {};
  $scope.data = data;

  data.notifCount = 0;
  // /!\ To use this, you should add Push plugin : ionic plugin add https://github.com/phonegap-build/PushPlugin
  PushPlugin.onNotification(function(notification){
    data.notifCount++;
  });
})

.controller('TwittsCtrl', function($scope, $window, $ionicModal, $ionicPopover, $ionicActionSheet, $log, TwittSrv){
  'use strict';
  var data = {}, fn = {}, ui = {};
  $scope.data = data;
  $scope.fn = fn;

  TwittSrv.getAll().then(function(twitts){
    data.twitts = twitts;
  });

  var userListState = {
    showDelete: false,
    showReorder: false
  };
  $scope.userList = {
    state: userListState,
    fn: {
      showDelete: function(){
        userListState.showDelete = !userListState.showDelete;
        userListState.showReorder = false;
        ui.twittsPopover.hide();
      },
      showReorder: function(){
        userListState.showDelete = false;
        userListState.showReorder = !userListState.showReorder;
        ui.twittsPopover.hide();
      },
      hideAll: function(){
        userListState.showDelete = false;
        userListState.showReorder = false;
      },
      delete: function(collection, elt){
        collection.splice(collection.indexOf(elt), 1);
      },
      reorder: function(collection, elt, fromIndex, toIndex){
        collection.splice(fromIndex, 1);
        collection.splice(toIndex, 0, elt);
      }
    }
  };

  fn.edit = function(twitt){
    $window.alert('Edit twitt: ' + twitt.content);
  };
  fn.share = function(twitt){
    $window.alert('Share twitt: ' + twitt.content);
  };

  fn.refresh = function(){
    TwittSrv.getAll(true).then(function(twitts){
      data.twitts = twitts;
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  fn.moreOptions = function(twitt){
    $ionicActionSheet.show({
      titleText: 'Options for '+twitt.user+'\'s twitt',
      buttons: [
        {text: 'Share <i class="icon ion-share"></i>'}
      ],
      buttonClicked: function(index){
        if(index === 0) { fn.share(twitt);                          }
        else            { $log.warn('Unknown button index', index); }
        return true;
      },
      destructiveText: 'Delete',
      destructiveButtonClicked: function(){
        $scope.userList.fn.delete(data.twitts, twitt);
        return true;
      },
      cancelText: 'Cancel',
      cancel: function(){}
    });
  };

  $ionicPopover.fromTemplateUrl('views/partials/twitts-options-popover.html', {
    scope: $scope
  }).then(function(popover){
    ui.twittsPopover = popover;
  });
  fn.showOptions = function(event){
    ui.twittsPopover.show(event);
  };

  $ionicModal.fromTemplateUrl('views/partials/send-twitt-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    ui.sendTwittModal = modal;
  });
  fn.writeTwitt = function(){
    ui.sendTwittModal.show();
  };
  fn.sendTwitt = function(form){
    form.saving = true;
    TwittSrv.save(form).then(function(){
      ui.sendTwittModal.hide();
      form.content = '';
      form.saving = false;
    });
  };
  fn.cancelSendTwitt = function(){
    ui.sendTwittModal.hide();
  };

  $scope.$on('$destroy', function(){
    if(ui.twittsPopover){ ui.twittsPopover.remove(); }
    if(ui.sendTwittModal){ ui.sendTwittModal.remove(); }
  });
})

.controller('TwittCtrl', function($state, $stateParams, $scope, $window, TwittSrv){
  'use strict';
  var twittId = $stateParams.twittId;
  var data = {};
  $scope.data = data;

  TwittSrv.get(twittId).then(function(twitt){
    if(twitt){
      data.twitt = twitt;
    } else {
      $state.go('app.tabs.twitts');
    }
  });
})

.controller('ChatCtrl', function($scope){
  'use strict';
})

.controller('NotifsCtrl', function($scope, UserSrv, PushPlugin, ToastPlugin){
  'use strict';
  var data = {}, fn = {};
  $scope.data = data;
  $scope.fn = fn;

  data.notifications = [];
  // /!\ To use this, you should add Push plugin : ionic plugin add https://github.com/phonegap-build/PushPlugin
  PushPlugin.onNotification(function(notification){
    notification.time = new Date();
    data.notifications.push(notification);
  });

  fn.sendPush = function(infos){
    UserSrv.get().then(function(user){
      PushPlugin.sendPush([user.pushId], infos).then(function(sent){
        if(sent){
          ToastPlugin.show('Notification posted !');
        }
      });
    });
  };
});

