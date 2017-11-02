controller.controller('TaskIndexController', function($scope, $localStorage, $stateParams, $location, Request, $ionicNavBarDelegate) {
        $scope.id = $stateParams.id;
        $scope.status = true;

        if (!$scope.id) {
                return $location.path('/main/grade');
        }

        $scope.fetchTask = function(loading){
                var promise = Request.Task({
                        task_id: $scope.id,
                        unloading: loading ? true : false
                }).then(function(data){
                        $scope.task = data;
                        $scope.hasTask = false;
                }, function(data){
                        $scope.hasTask = true;
                })
                return promise;
        }

        $scope.refreshHandle = function(){
                $scope.fetchTask(true).finally(function(){
                        $scope.$broadcast('scroll.refreshComplete');
                })
        }

        $scope.start = function() {
                Request.StartTask({
                        task_id: $scope.id
                }).then(function(result) {
                        if (result) {
                                $location.path('/main/task-start/' + $scope.id);
                        }
                });
        };

        $scope.fetchTask();
});

controller.controller('TaskStartController', function($scope, $localStorage, $ionicPlatform, $timeout, $ionicSlideBoxDelegate, $cordovaCamera, $ionicActionSheet, UploadImg, Public, $ionicModal, $interval, Request, $location, $stateParams, $sce, PhotoSwipe, $window) {
        $scope.id = $stateParams.id;

        $scope.interval = null;
        $scope.showTime = '00:00';
        $scope.answer_list = [];

        $scope.fetchAnswerList = $scope.reloadTaskList = function(){
                $interval.cancel($scope.interval);

                Request.AnswerList({
                        task_id: $scope.id
                }).then(function(result) {
                        if (result.task_status === 2 || result.task_status === 3) {
                                $location.path('/main/grade');
                        }

                        $ionicSlideBoxDelegate.$getByHandle('Slide').update();
                        //获取用时
                        $scope.play_time = result.play_time;

                        $scope.interval = $interval(function() {
                                $scope.play_time++;
                                $scope.showTime = Public.formatSeconds($scope.play_time);
                        }, 1000);

                        $scope.info = result;
                        $scope.answer_list = result.test_list;

                        //切换
                        $scope.$index = 0;
                        $scope.next = function(item) {

                                if (item.check && item.check.length > 0) {

                                        DoTask(item.test_number, item.check.join(','), function(result) {
                                                if (result) {
                                                        item.is_answered = 1;
                                                        $ionicSlideBoxDelegate.slide($scope.$index + 1);
                                                }
                                        });
                                } else {
                                        $ionicSlideBoxDelegate.slide($scope.$index + 1);
                                }
                        };

                        $scope.radio = [];
                        $scope.checkbox = [];
                        $scope.content = [];
                        $scope.answer = [];

                        for (var i in $scope.answer_list) {
                                $scope.answer_list[i].num = i;
                                switch ($scope.answer_list[i].test_type) {
                                        case 1:
                                                $scope.radio.push($scope.answer_list[i]);
                                                break;
                                        case 2:
                                                $scope.checkbox.push($scope.answer_list[i]);
                                                break;
                                        case 3:
                                                $scope.content.push($scope.answer_list[i]);
                                                break;
                                }
                        }
                        $scope.hasTaskList = false;
                }, function(){
                        $scope.hasTaskList = true;
                });
        }

        $scope.fetchAnswerList();

        $scope.fetchContent = $scope.reloadContent = function(){
                var reset = function(data, type){
                        return type ? $sce.trustAsHtml(data.toString().replace(/src=/g, 'onerror="contentImgError(this, true)" src=')):
                               $sce.trustAsHtml(data.toString().replace(/src=/g, 'onerror="contentImgError(this)" src='));
                }
                $scope.thisQuestion = $scope.answer_list[$scope.$index];
                $scope.thisQuestion.test_type_text = Public.TestType($scope.answer_list[$scope.$index].test_type);
                if (!$scope.thisQuestion.content) {
                        Request.TaskDetail({
                                task_id: $scope.id,
                                test_number: $scope.thisQuestion.test_number
                        }).then(function(data) {
                                //console.log(data);
                                if(!angular.isArray(data)) {

                                    if ($scope.thisQuestion.is_answered) {
                                            DefaultCheck($scope.thisQuestion, data.cloud_data.student_answer);
                                    }
                                    $scope.thisQuestion.content = data.cloud_data;
                                    $scope.thisQuestion.content.topic = reset($scope.thisQuestion.content.topic, true);
                                    $scope.thisQuestion.content.options_a = reset($scope.thisQuestion.content.options_a);
                                    $scope.thisQuestion.content.options_b = reset($scope.thisQuestion.content.options_b);
                                    $scope.thisQuestion.content.options_c = reset($scope.thisQuestion.content.options_c);
                                    $scope.thisQuestion.content.options_d = reset($scope.thisQuestion.content.options_d);
                                    $scope.thisQuestion.content.options_e = reset($scope.thisQuestion.content.options_e);
                                    $scope.thisQuestion.content.options_f = reset($scope.thisQuestion.content.options_f);
                                    $scope.thisQuestion.content.solution = reset($scope.thisQuestion.content.solution);
                                    $ionicSlideBoxDelegate.slide($scope.$index);
                                    $scope.thisQuestion.status = false;
                                }else{
                                    $location.path('/main/grade');
                                }
                        }, function(){
                                $scope.thisQuestion.status = true;
                        });
                }
        }

        //监听切换状态
        $scope.$watch('$index', function(data) {
                if (data === undefined) return false;
                if ($scope.thisQuestion && $scope.thisQuestion.test_type === 2 && $scope.thisQuestion.change === true) {
                        var item = $scope.thisQuestion;
                        DoTask(item.test_number, item.check.join(','), function(result) {
                                if (result) {
                                        item.is_answered = 1;
                                        item.change = false;
                                }
                        });
                }
                $scope.fetchContent();
                
        })

        $window.contentImgError = function (img, type){
                var url = img.src;
                var element = angular.element(img);
                var textView = angular.element('<span class="image-load-error">图片加载失败, 点击重新加载</span>')
                               .css('display', 'inline-block');
                element.attr('title', '');

                if(element.length) reload(element[0], url, 3);
                function reload (elem, url, maxnum){
                        var image = new Image();
                        if(maxnum > 0){
                                image.onerror = function(){
                                        reload(elem, url, maxnum-1);
                                };
                                image.onload = function(){
                                        if (this.naturalHeight + this.naturalWidth === 0) {
                                                this.onerror();
                                                return;
                                        }
                                        elem.src = url;
                                }
                                image.src = url;
                        }else{
                                image.onerror = image.onload = null;
                                if(type){
                                        element.css('display', 'none').after(textView);
                                        textView.off().on('click', function(){
                                                var image = new Image();
                                                angular.element(image).on('load', function(){
                                                        element.css('display', 'block');
                                                        textView.css('display', 'none');
                                                        element.prop('src', url);
                                                })
                                                image.src = url;
                                        })
                                }
                        } 
                }
        }

        //点击答题卡跳转题目
        $scope.dump = function(i) {
                $scope.hideModal();
                $ionicSlideBoxDelegate.slide(i);
        };

        function DefaultCheck(item, check) {
                switch (item.test_type) {
                        case 1:
                                if (check[0]) {
                                        item.check = check[0];
                                }
                                break;
                        case 2:
                                item.check = check;
                                break;
                        case 3:
                                item.check = check;
                                break;
                }
        }
        //选择

        $scope.checkthis = function(option, type, item) {

                if (type === 'radio') {
                        item.check = option;
                        DoTask(item.test_number, option, function(result) {
                                if (result) {
                                        item.is_answered = 1;
                                        if ($scope.$index + 1 != $scope.answer_list.length) {
                                                $ionicSlideBoxDelegate.slide($scope.$index + 1);
                                        }
                                }
                        });

                } else {
                        item.change = true;
                        if (!item.check) item.check = [];
                        if (item.check.indexOf(option) >= 0) {
                                Public.removeByValue(item.check, option);
                        } else {
                                item.check.push(option);
                                item.check = Public.unique(item.check);
                        }
                }
        };

        //提交作业
        function DoTask(test_numbser, answer, cb) {
                Request.DoTask({
                        task_id: $scope.id,
                        test_number: test_numbser,
                        answer: answer,
                        play_time: $scope.play_time
                }).then(function(result) {
                        cb(true);
                }, function(){
                    cb(false);
                });
        }

        //解答题图片预览
        $scope.previewPicture = function(num, item, event) {
                var elem = angular.element(event.target);
                if(item == '') return;
                if(elem.prop('loaded')){
                    
                    PhotoSwipe.show($scope.thisQuestion.check, num);
                }else{
                        var image = new Image();
                        angular.element(image).off().on('load', function(){
                                $scope.thisQuestion.check[num] = item;
                                elem.prop('loaded', true);
                                image = null;
                        })
                        image.src = item;
                }
        };

        $scope.change = function($index) {

                $scope.$index = $index;
        };

        //答题卡
        $ionicModal.fromTemplateUrl(
                'templates/task/modal.html', {
                        scope: $scope,
                        animation: 'slide-in-up'
                }).then(function(modal) {
                $scope.modal = modal;
        });

        $scope.showModal = function() {

                if ($scope.thisQuestion && $scope.thisQuestion.test_type === 2 && $scope.thisQuestion.change === true) {
                        var item = $scope.thisQuestion;
                        DoTask(item.test_number, item.check.join(','), function(result) {
                                if (result) {
                                        item.is_answered = 1;
                                        item.change = false;
                                }
                        });
                }
                $scope.modal.show();
        };

        $scope.hideModal = function() {

                $scope.modal.hide();
        };


        //解答题
        $scope.show = function(items) {
                // 显示上拉菜单
                if (!items || !items.check) {
                        items.check = [];
                }

                function success(imageData) {

                        //上传成功
                        if (imageData) {

                                items.check.push(imageData);
                                DoTask(items.test_number, items.check.join(','), function(result) {
                                        if (result) {
                                                items.is_answered = 1;
                                        }
                                });
                        } else {
                                Public.Toast('请选择一张图片');
                        }
                }

                function error(data, type) {
                        if (type) {
                                items.check.pop();
                        }
                        return Public.Toast(data);
                }
                UploadImg.show(success, error);
        };

        $scope.modal = false;

        //删除图像
        $scope.remove = function(items, x) {
                var item = angular.copy(items);
                item.check.splice(x, 1);

                DoTask(items.test_number, item.check.join(','), function(result) {
                        if (result) {
                                items.check.splice(x, 1);
                                Public.Toast('删除成功');
                                if (items.check.length <= 0) {
                                        items.is_answered = 0;
                                }
                        }
                });
        };


        //完成作业
        $scope.submit = function() {
                var input = '';
                var unanswer = 0;
                for (var i in $scope.answer_list) {
                        if ($scope.answer_list[i].is_answered == 0) {
                                unanswer++;
                        }
                }
                input = unanswer > 0 ? '您的作业未答完,确认要提交?' : '您是否确认要提交?';
                Public.Modal({
                        title: '温馨提示',
                        template: input
                }, function(res) {
                        if (res) {
                                $scope.submitTask();
                        }
                })
        };

        $scope.submitTask = function() {

                $scope.modal.hide();
                Request.SubmitTask({
                        task_id: $scope.id,
                        play_time: $scope.play_time
                }).then(function(result) {
                        if (result.err_code == 0) {
                                //todo 成功后跳转
                                $location.path('/main/task-info/' + $scope.id).search('redirect', 1);
                        } else {
                                //todo 失败后提示
                                Public.Toast('提交失败');
                        }
                });
        };
})


.directive('viewPicture', ['$rootScope', 'PhotoSwipe', '$window', function($rootScope, PhotoSwipe, $window){
        return {
                restruct: 'A',
                link: function(scope, elem, attr){
                        var view = $window.innerWidth
                        elem.off().on('click', function(evt){
                            
                                if(evt.target.nodeName.toLowerCase() == 'img'){
                                        var img = new Image();
                                        img.src = evt.target.src;
                                        img.onload=function(){
                                                var rw = this.width;
                                                var rh = this.height;
                                                if(rw >= view){
                                                        $rootScope.showImgBox = true;
                                                        PhotoSwipe.show([evt.target.src], 1, scope); 
                                                }
                                                img = null;
                                        }                       
                                        //console.log(evt.target.src, $window)
                                }
                        })
                }
        }
}])

.directive('imgLoad', [function(){
        return {
                restrict: 'A',
                link: function(scope, elem, attr){
                        var url = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                        
                        attr.$observe('ngSrc', function(){

                                elem.on('load', function(){
                                    elem.prop('loaded', true)
                                    elem.off('load error')
                                })
                                
                                elem.on('error', function(){
                                   // elem.prop('src', url);
                                    elem.prop('loaded', false)
                                })
                        })
                }
        }
}])


.factory('PhotoSwipe', ['$rootScope', '$compile', '$ionicPlatform', '$ionicBody', '$q', function($rootScope, $compile, $ionicPlatform, $ionicBody, $q) {

        return {
                show: function(pictures, index, scope){
                        var scope = $rootScope.$new(true);
                        var defer = $q.defer();

                        angular.extend(scope, {pictures: pictures, index: index});

                        var element = scope.element = $compile('<photo-swipe></photo-swipe>')(scope);
                        $ionicBody.append(element);
                        scope.preload = function(list, callback){
                                var items = [],
                                    index = 0;
                                for(var i=0, len=list.length; i<len; i++){
                                        var img = new Image();
                                        img.src = list[i];
                                        img.index = i;
                                        img.onload=function(){
                                                var rw = this.width;
                                                var rh = this.height;
                                                items.push({
                                                        src: this.src,
                                                        w: rw,
                                                        h: rh,
                                                        index: this.index
                                                });
                                                img = null;
                                                index++;
                                                if(index == list.length){
                                                    callback(items);
                                                }
                                        }
                                        img.onerror = function(){
                                            
                                                items.push({
                                                        src: 'img/broken.png',
                                                        w: 500,
                                                        h: 500,
                                                        index: this.index
                                                });
                                                index++;
                                                if(index == list.length){
                                                    callback(items);
                                                }
                                        }
                                }
                        }
                        
                        scope.cancel = function(){}
                }
        }
}])

.directive('photoSwipe', ['Public', '$rootScope', '$timeout', '$ionicPlatform', function(Public, $rootScope, $timeout, $ionicPlatform){
        return {
                restrict: 'AE',
                replace: true,
                link: function(scope, element, attrs){
                        
                        $rootScope.showImgBox = true;
                        var swipeWrap = document.querySelectorAll('.pswp')[0];
                        var pictureLen = scope.pictures.length;

                        var options = {
                                history: false,
                                focus: false,
                                loop: false,
                                tapToClose: true,
                                showAnimationDuration: 0,
                                hideAnimationDuration: 0,
                                showHideOpacity: true
                        };

                        scope.preload(scope.pictures,function(data){
                            if(angular.isArray(data) && data.length) {

                                data = data.sort(function(a,b){return a.index-b.index})
                                $rootScope.gallery = new PhotoSwipe(swipeWrap, PhotoSwipeUI_Default, data, options);

                                $rootScope.gallery.listen('gettingData', function(index, item){})

                                $rootScope.gallery.init();

                                $rootScope.gallery.goTo(scope.index);

                                var deregister = $ionicPlatform.registerBackButtonAction(function(e) {
                                        $rootScope.gallery.close();
                                        return false;
                                }, 100);


                                $rootScope.gallery.listen('close', function() {
                                        $rootScope.showImgBox = false;
                                        deregister();
                                        element.remove();
                                });
                            }
                        })
                        
                        scope.$on('$destroy', function(){
                                element.remove();
                        })

                        //Public.showImg(scope.pictures, scope.index, $rootScope)
                },
                templateUrl: 'templates/public/comImageBox.html'
        }
}])


.directive('contentLoadStatus', ['$ionicBind', '$compile', '$timeout',function($ionicBind, $compile, $timeout){
        return {
                restrict: 'A',
                scope: {
                        showReloadBtn: '@',
                        reloadType: '@',
                        contentLoadStatus: '=',
                        reloadViewHandler: '&'
                },
                controller: function($scope, $element){

                },
                
                link: function(scope, element, attr){
                        
                        var statusText = ['', '加载失败, 点击重新加载', '加载失败, 下拉重新加载'];

                        var view = angular.element('<div><img src="img/load-error.png"><p class="error-text" ng-bind="statusText"></p></div>');
                        view.addClass('content-load-error');
                        var btn = angular.element('<span class="reload-btn" flash>重新加载</span>');

                        scope.showReloadBtn = scope.$eval(scope.showReloadBtn);
                       
                        scope.statusText = statusText[scope.reloadType || 0];

                        scope.reloadViewHandler = ionic.debounce(scope.reloadViewHandler, 1e3, true);

                        if(scope.showReloadBtn) view.append(btn);
                        scope.$watch('contentLoadStatus', function(value){
                                if(value == undefined) return; 
                                if(value){
                                        var childScope = scope.$new();
                                        element.append($compile(view)(childScope));
                                        element.find('span').off().on('click', function(){
                                                scope.reloadViewHandler()
                                        })
                                }else{
                                        view.remove();
                                }
                        })

                        scope.$on('$destroy', function(){})
                }
        }
}])

.config(function($ionicConfigProvider) {

        $ionicConfigProvider.scrolling.jsScrolling(true);

});
