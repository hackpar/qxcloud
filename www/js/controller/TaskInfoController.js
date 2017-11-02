controller.controller('TaskInfoController', function($scope, $localStorage, Request, $stateParams, $location, $rootScope, $ionicHistory) {
        $scope.id = $stateParams.id;
        $scope.answer_list = [];

        $scope.fetchAnswerList = function(loading){
                var promise = Request.AnswerList({
                        task_id: $scope.id,
                        unloading: loading ? true : false
                }).then(function(data){

                        $scope.answer = data;
                        $scope.answer_list = data.test_list;
                        $scope.radio = [];
                        $scope.checkbox = [];
                        $scope.content = [];
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
                                var answer_type = $scope.answer_list[i].answer_type;
                                var is_answered = $scope.answer_list[i].is_answered;
                                if (is_answered) {
                                        switch (answer_type) {
                                        case 0:
                                                $scope.answer_list[i].answer_class = 'none';
                                                break;
                                        case 1:
                                                $scope.answer_list[i].answer_class = 'success';
                                                break;
                                        case 2:
                                                $scope.answer_list[i].answer_class = 'error';
                                                break;
                                        default:
                                                $scope.answer_list[i].answer_class = 'half';
                                                break;
                                        }
                                } else {
                                        $scope.answer_list[i].answer_class = 'blank';
                                }
                        }
                        $scope.hasAnswerList = false;
                }, function(data){
                        $scope.hasAnswerList = true;
                })
                return promise;
        }

        $scope.refreshHandle = function(){
                $scope.fetchAnswerList(true).finally(function(){
                        $scope.$broadcast('scroll.refreshComplete');
                })
        }

        $rootScope.$ionicGoBack = function(){

                if($location.search().redirect){
                        $location.path('/main/grade');
                }else{
                        $ionicHistory.goBack();
                }
        }

        $scope.fetchAnswerList();
});

controller.controller('TaskInfoDetailsController', function($scope, $localStorage, $ionicPlatform, $sce, $timeout, $ionicSlideBoxDelegate, $cordovaCamera, $ionicActionSheet, UploadImg, Public, PhotoSwipe, $ionicModal, $interval, Request, $location, $stateParams, $cordovaFileTransfer, $window) {

        $scope.id = $stateParams.id;
        $scope.answer_list = [];
        $scope.number = $stateParams.number;

        $scope.fetchAnswerList = $scope.reloadAnswerList = function(){
                Request.AnswerList({
                        task_id: $scope.id
                }).then(function(result) {

                        $ionicSlideBoxDelegate.$getByHandle('Slide').update();
                        $scope.info = result;
                        $scope.answer_list = result.test_list;
                        $scope.restAnswerList();

                        setTimeout(function() {
                                $ionicSlideBoxDelegate.slide($scope.number);
                        }, 10);

                        $scope.$watch('$index', function(value) {
                                closeVoice();
                                if(value == undefined) return;
                                if ($scope.API) {
                                        for (var i in $scope.API) {
                                                $scope.API[i].stop();
                                        }
                                }
                                $scope.fetchTaskDetail();
                        });

                        $scope.$index = parseInt($scope.number);

                        $scope.hasAnswerList = false;
                }, function(){

                        $scope.hasAnswerList = true;
                });
        }

        $scope.fetchAnswerList();

        $scope.restAnswerList = function(){
                $scope.radio = [];
                $scope.checkbox = [];
                $scope.content = [];

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
                        var answer_type = $scope.answer_list[i].answer_type;
                        var is_answered = $scope.answer_list[i].is_answered;
                        if(is_answered){
                                switch (answer_type) {
                                        case 0:
                                                $scope.answer_list[i].answer_class = 'none';
                                                break;
                                        case 1:
                                                $scope.answer_list[i].answer_class = 'success';
                                                break;
                                        case 2:
                                                $scope.answer_list[i].answer_class = 'error';
                                                break;
                                        default:
                                                $scope.answer_list[i].answer_class = 'half';
                                                break;
                                }
                        }else{
                                $scope.answer_list[i].answer_class = 'blank';
                        }
                }
        }

        $scope.fetchTaskDetail = $scope.reloadListItem = function(){

                var DefaultCheck = function(item, check) {
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

                var sortBy = function(attr, rev){
                        rev = rev ? -1 : 1;
                        return function(a,b){
                                a = a[attr];
                                b = b[attr];
                                if(a < b){
                                        return rev * -1;
                                }
                                if(a > b){
                                        return rev * 1;
                                }
                                return 0;
                        }
                }

                var reset = function(data, type){
                        return type ? $sce.trustAsHtml(data.toString().replace(/src=/g, 'onerror="contentImgError(this, true)" src=')):
                               $sce.trustAsHtml(data.toString().replace(/src=/g, 'onerror="contentImgError(this)" src='));
                }

                $scope.thisQuestion = $scope.answer_list[$scope.$index];
                //console.log($scope.answer_list, $scope.$index)
                $scope.thisQuestion.test_type_text = Public.TestType($scope.answer_list[$scope.$index].test_type);
                if (!$scope.thisQuestion.content) {
                        Request.TaskDetail({
                                task_id: $scope.id,
                                test_number: $scope.thisQuestion.test_number
                        }).then(function(data) {

                                $scope.thisQuestion.content = data.cloud_data;

                                if(data.cloud_data && angular.isArray(data.cloud_data.voice_list)){
                                    $scope.thisQuestion.content.voice_list = data.cloud_data.voice_list.sort(sortBy('type'));
                                }
                                console.log(data)
                                DefaultCheck($scope.thisQuestion, data.cloud_data.student_answer);

                                $scope.thisQuestion.content.topic = reset($scope.thisQuestion.content.topic, true);
                                $scope.thisQuestion.content.options_a = reset($scope.thisQuestion.content.options_a);
                                $scope.thisQuestion.content.options_b = reset($scope.thisQuestion.content.options_b);
                                $scope.thisQuestion.content.options_c = reset($scope.thisQuestion.content.options_c);
                                $scope.thisQuestion.content.options_d = reset($scope.thisQuestion.content.options_d);
                                $scope.thisQuestion.content.options_e = reset($scope.thisQuestion.content.options_e);
                                $scope.thisQuestion.content.options_f = reset($scope.thisQuestion.content.options_f);
                                $scope.thisQuestion.content.solution = reset($scope.thisQuestion.content.solution, true);
                                if(data && data.test_type==3){
                                        $scope.thisQuestion.content.answer = reset($scope.thisQuestion.content.answer, true);
                                }

                                $scope.thisQuestion.answer_type_text = Public.AnswerType($scope.thisQuestion.answer_type);

                                if ($scope.thisQuestion.content.video_url) {

                                        $scope.thisQuestion.content.video = {};
                                        $scope.thisQuestion.content.video.sources = [
                                                { src: $sce.trustAsResourceUrl($scope.thisQuestion.content.video_url), type: "video/mp4" },
                                        ];
                                        $scope.thisQuestion.content.video.config = {
                                                autoHide: true,
                                                autoHideTime: 3000,
                                                autoPlay: false,
                                                sources: $scope.thisQuestion.content.video.sources,
                                                video_index: 0
                                        };
                                }
                                $scope.thisQuestion.status = false;
                                $ionicSlideBoxDelegate.slide($scope.$index);
                        }, function(){
                                $scope.thisQuestion.status = true;
                        });
                }
        }

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

        $scope.test = function() {
                $scope.play = ($scope.play) ? false : true;
        };

        $scope.change = function($index) {

                $scope.$index = $index;
        };

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

        //获取答题卡数据
        $ionicModal.fromTemplateUrl(
                'templates/task/info/modal.html', {
                        scope: $scope,
                        animation: 'slide-in-up'
                }).then(function(modal) {
                $scope.modal = modal;
        });
        $scope.showModal = function() {

                $scope.modal.show();
        };
        $scope.hideModal = function() {

                $scope.modal.hide();
        };


        //播放视频
        $scope.API = [];

        $scope.onPlayerReady = function(API) {

                $scope.API.push(API);

                API.mediaElement[0].addEventListener('play', function() {
                        closeVoice();
                }, false);
        };

        function closeVideo() {

                for (var i in $scope.API) {
                        $scope.API[i].pause();
                }
        }

        function closeVoice() {


                if (!ionic.Platform.isAndroid() && ionic.Platform.navigator.platform !== 'Win32') {
                        recordAudio.stopAudio();
                }

                if ($scope.thisQuestion && $scope.thisQuestion.content && $scope.thisQuestion.content.voice_list) {
                        if ($scope.thisQuestion.content.voice_list[0]) {

                                for (var i in $scope.thisQuestion.content.voice_list[0].voice) {
                                        $scope.thisQuestion.content.voice_list[0].voice[i].play = false;
                                        if ($scope.thisQuestion.content.voice_list[0].voice[i].media) {
                                                $scope.thisQuestion.content.voice_list[0].voice[i].media.stop();
                                        }
                                }
                        }

                        if ($scope.thisQuestion.content.voice_list[1]) {

                                for (var i in $scope.thisQuestion.content.voice_list[1].voice) {
                                        $scope.thisQuestion.content.voice_list[1].voice[i].play = false;
                                        if ($scope.thisQuestion.content.voice_list[1].voice[i].media) {
                                                $scope.thisQuestion.content.voice_list[1].voice[i].media.stop();
                                        }
                                }
                        }
                }
        }

        //播放音频
        $scope.play = function(voice) {
                var voice_status = voice.play;
                if (ionic.Platform.isAndroid()) {
                      voice.loading = true;
                }
                closeVideo();
                closeVoice();
                voice.play = (voice_status) ? false : true;
                if (voice.play === false) {
                        // console.log('pause play');
                        voice.loading = false;
                        play(voice, 'stop');
                        return true;
                }
                if (voice.media) {
                        play(voice, 'play');
                        return true;
                }
                play(voice, 'play');
        };

        function play(voice, status) {
                //android
                if (ionic.Platform.isAndroid()) {

                        if (voice.media) {
                                if (status == 'play') {
                                        voice.media.play();
                                        return false;
                                } else {
                                        voice.media.stop();
                                        return false;
                                }
                        } else {
                                var mediaRec = new Media(voice.url,
                                        function() {

                                        },
                                        function(error) {
                                                console.log(error);
                                                if (error.code !== 0) {
                                                     // Public.Toast('语音播放失败');
                                                    voice.play = voice.loading = false;
                                                    $scope.$apply();
                                                }
                                        },
                                        function(status) {
                                                if(status > 1){
                                                        voice.loading = false;
                                                }
                                                if (status === 4) {
                                                        voice.play = false;
                                                }
                                                $scope.$apply();
                                                console.log(status);
                                        });
                                voice.media = mediaRec;
                                voice.media.play();
                        }
                } else {
                        if (status == 'play') {
                                console.log('play');
                                recordAudio.stopAudio();
                                downloadamr(voice);
                        } else {
                                console.log('stop');
                                recordAudio.stopAudio();
                        }
                }

        };

        function downloadamr(voice) {
                var amrname = voice.url.split('/');
                amrname = amrname[amrname.length - 1];
                var targetPath = cordova.file.documentsDirectory + amrname; //APP下载存放的路径，可以使用cordova file插件进行相关配置
                var trustHosts = true;
                var options = {};

                voice.loading = true;
                $cordovaFileTransfer.download(voice.url, targetPath, options, trustHosts).then(function(result) {

                  voice.loading = false;
                        // FileTransfer
                        recordAudio.convertToWav(targetPath, function(success) {

                                voice.play = true;
                                recordAudio.play(success.fullPath);
                                $timeout(function() {
                                        voice.play = false;
                                        $scope.$apply();
                                }, success.duration * 1000);
                        });
                        voice.targetPath = targetPath;
                }, function(err) {
                        console.log(err);
                        voice.loading = false;
                        voice.play = false;
                }, function(progress) {
                        //进度，这里使用文字显示下载百分比
                        console.log(progress);
                });
        }

        $scope.$on('$ionicView.beforeLeave', function() {
                if ($scope.API) {
                        for (var i in $scope.API) {
                                $scope.API[i].stop();
                        }
                }
                closeVoice();
        });

        $ionicPlatform.ready(function() {
                $ionicPlatform.registerBackButtonAction(function(e) {
                        if ($scope.API) {
                                for (var i in $scope.API) {
                                        $scope.API[i].stop();
                                }
                        }
                        closeVoice();
                })
                $ionicPlatform.on('pause', function() {
                        if ($scope.API) {
                                for (var i in $scope.API) {
                                        $scope.API[i].stop();
                                }
                        }
                        closeVoice();
                });
        });
});
