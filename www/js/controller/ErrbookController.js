angular.module('starter.controllers')
.controller('ErrbookController', ['$scope', 'Request', '$localStorage', function($scope, Request, $localStorage){
  // console.log(Request.getSubjectList());
  $scope.relation = {
    1: "yuwen",
    2: "shuxue",
    3: 'yingyu',
    4: "huaxue",
    5: "wuli",
    6: "",//shengwu
    7: "",//lishi
    8: "",//dili
    9: "",//zhengzhi
    10: "yuwen",
    11: "shuxue",
    12: "yingyu",
    13: "huaxue",
    14: "wuli",
    15: "",//shengwu
    16: "",//lishi
    17: "",//dili
    19: "",//kexue
    22: "",//xiaoshengchu
    23: "yuwen",
    24: "shuxue",
    25: "yingyu",
  };
  console.log($scope.relation);
  console.log($scope.relation);
  $scope.getList = function(){

    var promise = Request.getSubjectList({

    }).then(function(result){

      for(var i in result){
        var subject_id = result[i].subject_id;
        if($scope.relation[subject_id] || $scope.relation[subject_id] == ''){
          result[i].name = $scope.relation[subject_id];
        }else{
          result[i].name = $scope.relation[1];
        }
      }
      $scope.list = result;
      $localStorage.subject_list = result;
      console.log(result);
    });
    return promise;
  };
  $scope.getList();

  $scope.refreshHandle = function(){
    $scope.getList(true).finally(function(){
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

}])


.controller('ErrbookListController', ['$scope', 'Request', '$stateParams', '$location', '$localStorage', function($scope, Request, $stateParams, $location, $localStorage){
  var subject_list = $localStorage.subject_list;
  $scope.id = $stateParams.id;
  $scope.option_name = '全部题型';

  for(var i in subject_list){
    if(subject_list[i].subject_id == $scope.id){
      $scope.subject_name = subject_list[i].subject_name;
    }
  }
  $scope.open = function(){
    $scope.openoption = ($scope.openoption)?false:true;
  };

  $scope.close = function(){
    $scope.openoption = false;
  };

  $scope.$watch('months',function(){
    $scope.openoption = false;
    Request.getLoreList({
      subject_id: $scope.id,
      months: $scope.months
    }).then(function(result){
      console.log(result);
      if(!result || result.length <= 0){
        $location.path('/errbook');return;
      }
      $scope.list = result;
      $scope.counts = 0;
      for(var i in result){
        $scope.counts += result[i].test_count;
      }
    });
  });

  $scope.months = 0;

  $scope.options = function(num,name){

    $scope.months = num;
    $scope.option_name = name;
  };

}])


.controller('ErrbookItemsController', ['$scope', 'Request', '$stateParams', '$location', '$window', function($scope, Request, $stateParams, $location, $window){

  $scope.subject_id = $stateParams.subject_id;
  $scope.lore_id = $stateParams.lore_id;

  $scope.data = {
    subject_id: $scope.subject_id,
    lore_id: $scope.lore_id,
    test_type: 0,       //题型
    test_difficulty_level: 0,//难度
    page: 1,
  };

  $scope.typelist = {
      0: '全部题型',
      1: '单选题',
      2: '多选题',
      3: '解答题'
  };

  $scope.open = function(type){
    if(type == 'type'){
      if($scope.option_type === true){
        $scope.option_type = false;
      }else{
        $scope.option_type = true;
      }
      $scope.option_diff = false;
    }else{
      if($scope.option_diff === true){
        $scope.option_diff = false;
      }else{
        $scope.option_diff = true;
      }
      $scope.option_type = false;
    }
  };

  $scope.close = function(){
    $scope.option_type = false;
    $scope.option_diff = false;
  };


  $scope.getList = function(){

    var promise = Request.getTestList($scope.data).then(function(result){

      console.log(result);
      $scope.list = result.test_list;
      $scope.test_count = result.test_count;
      $scope.has_next = result.has_next;

    });
    return promise;
  };

  $scope.check_diff = function(num){
    $scope.data.test_difficulty_level = num;
  };


  $scope.check_type = function(num){
    $scope.data.test_type = num;
  };
  $scope.$watch('data',function(){
      if(!$scope.data || $scope.data == undefined)return;
      console.log($scope.data);
    $scope.getList();
  },true);

  $scope.onscroll =  function() {
    console.log(123);
    $scope.option_type = false;
    $scope.option_diff = false;
  };


  $scope.refreshHandle = function(){
    delete $scope.list;
    $scope.getList(true).finally(function(){
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.loadMore = function(){
    console.log(123);
  }

}]);
