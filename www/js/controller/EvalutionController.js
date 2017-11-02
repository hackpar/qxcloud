angular.module('starter.controllers')

.controller('DailyEvalutionController', ['$scope', '$timeout', 'evalutionScore', '$stateParams', 'Request', function($scope, $timeout, evalutionScore, $stateParams, Request){

        $scope.title = '';
        $scope.distance = null;

        $scope.evalutionData = {
                student_index: 0,
                class_student_count: 0,
                average_accuracy: 0,
                max_accuracy: 0,
                student_accuracy: 0,
                synthesis_level: 'A',
                class_name: '',
                lore_list: []
        }

        $scope.class_number = $stateParams.class_number;

        $scope.initial = function(op){
                var promise = Request.classReport({
                        unloading: op ? true : false,
                        class_number: $scope.class_number
                }).then(function(data){
                        if(data.data && !angular.isArray(data.data)){
                                var lore_list = [];
                                $scope.evalutionData = data.data;
                                if(data.data.lore_list && data.data.lore_list.length){
                                    angular.forEach(data.data.lore_list, function(value, key){
                                            lore_list.push({
                                                student_score:  value.student_score,
                                                average_score: value.average_score,
                                                max_score: value.max_score
                                            })
                                    })
                                }
                                $scope.distance = angular.copy(lore_list);
                                evalutionScore.setScore($scope.distance);
                                $scope.status = false;
                        }else{
                                $scope.status = false;
                        }
                }, function(data){
                        $scope.status = true;
                })
                return promise;
        }

        $scope.refreshHandle = function(){
                $scope.initial(true).finally(function(){
                        $scope.$broadcast('scroll.refreshComplete');
                })
        }

        $scope.initial()
}])


.controller('LiveEvalutionController', ['$scope', '$timeout', 'evalutionScore', '$stateParams', 'Request', function($scope, $timeout, evalutionScore, $stateParams, Request){

        $scope.title = '';
        $scope.distance = null;

        $scope.evalutionData = {
                student_index: 0,
                class_student_count: 0,
                average_accuracy: 0,
                max_accuracy: 0,
                student_accuracy: 0,
                synthesis_level: 'A',
                school_name: '',
                course_name: '',
                student_name: '',
                lore_list: []
        }


        $scope.course_id = $stateParams.course_id;

        $scope.initial = function(op){
                var promise = Request.courseReport({
                        course_id: $scope.course_id,
                        unloading: op ? true : false
                }).then(function(data){
                        if(data.data && !angular.isArray(data.data)){

                                var lore_list = [];
                                $scope.evalutionData = data.data;
                                if(data.data.lore_list && data.data.lore_list.length){
                                    angular.forEach(data.data.lore_list, function(value, key){
                                            lore_list.push({
                                                student_score:  value.student_score,
                                                average_score: value.average_score,
                                                max_score: value.max_score
                                            })
                                    })
                                }
                                $scope.distance = angular.copy(lore_list);

                                evalutionScore.setScore($scope.distance);
                                $scope.status = false;
                        }else{
                                $scope.status = false;
                        }
                }, function(data){
                        $scope.status = true;
                })
                return promise;
        }

        $scope.refreshHandle = function(){
                $scope.initial(true).finally(function(){
                        $scope.$broadcast('scroll.refreshComplete');
                })
        }
        
        $scope.initial()
}])


.filter('parseIntFilter', function(){
        return function(value){
            if(angular.isNumber(value) && !isNaN(value)){
                
                return Math.round(value);
            }else{
                return 0;
            }
        }
})

.filter('reviseScoreFilter', function(){
        return function(value){
            if(angular.isNumber(value) && !isNaN(value)){
                
                if(value > 98){
                        return 98;
                }else{
                    return value;
                }
            }
        }
})

.service('evalutionScore', [function(){
        this.score = null;
        this.distance = 15;
        this.isApproach = false;

        /**
         * reset persent
         * return score persent...
         */
        this.compare = function(){
                var result = [];
                        
                angular.forEach(this.score, function(value){
                        var index = 0;
                        var score = [];
                        angular.forEach(value, function(val, key){
                                score.push(val)
                        })
                        angular.forEach(score, function(value, key){
                                var a = Math.round(score[0]), 
                                    b=Math.round(score[1]), 
                                    c=Math.round(score[2]);

                                if(c <= 90){
                                        if(Math.abs(c-b) <= 3){
                                            score[2] = c + 2;
                                        }

                                        if(b > 9 && Math.abs(c-b) <= 5) {
                                            score[1] = b - 1;
                                            score[2] = c + 2;
                                        }
                                }
                                if(c >= 90){
                                        if(Math.abs(c-b) <= 5){
                                            score[1] = b - 4;
                                            score[2] = c;
                                        }
                                }
                                if(c >= 96){
                                        if(Math.abs(c-b) <= 6){
                                            score[1] = c - 5;
                                            score[2] = c - 2;
                                        }
                                }

                                if(a >= 96){ score[0] = 94;}
                                if(c >= 96){ score[2] = 94;}
                                if(b >= 90){ score[1] = 88;}
                                if(b == 100){ score[1] = 82;}
                                if(c == 100){ score[2] = 92;}
                                if(a == 100){ score[0] = 92;}
                        })

                        angular.forEach(value, function(val, key){
                                value[key] = score[index++];
                        })
                        result.push(value);
                })
                        
                this.score = result;
        }

        this.update= function(){}

        this.setScore = function(score){

                this.score = score;
                this.compare()
                return this.score;
        }
}])


.directive('circleBubble', ['$timeout', function($timeout){
        return {
                restrict: 'AE',
                scope: {
                        persent: '=',
                        title: '@',
                        duration: '=',
                        radius: '=',
                        waterColor: '=',
                        lineWidth: '='
                },
                template: '<div class="circle"><div class="gradient">'+
                                 '<div class="circle-semi-a" style="height:{{100-value}}%"></div>'+
                                 '<div class="circle-semi-b" style="height:{{value}}%"></div></div>'+
                                 '<div class="circle-text">{{value}}%</div>'+
                          '</div><div class="circle-title" ng-bind="title"></div>',
                replace: false,
                link: function (scope, element, attr) {

                        scope.$watch('persent', function(nv, ov){
                                var isIncrease, steps, stepDuration, delta = 1, duration=1000;
                                scope.value = 0
                                if(ov == undefined) ov =0;
                                if(nv && nv !== ov){
                                    
                                        nv = Math.round(nv), ov = Math.round(ov);
                                        isIncrease = nv > ov;
                                        
                                        delta += nv % 1;
                                        steps = Math.floor(Math.abs(nv - ov) / delta);
                                        stepDuration = duration / steps;

                                        var requestAnimFrame = window.requestAnimationFrame ||
                                            window.webkitRequestAnimationFrame || function (callback) {
                                                    setTimeout(callback, 1000 / 60);
                                            }
                                        //return scope.value = nv;
                                        function animate(last){
                                                if(isIncrease) {
                                                        ov += delta;
                                                }else{
                                                        ov -= delta;
                                                }

                                                if ((isIncrease && ov >= nv) || (!isIncrease && ov <= nv)) {
                                                        requestAnimFrame(function () {
                                                                
                                                                scope.$apply(function(){
                                                                        scope.value =  Math.round(nv);
                                                                });
                                                        });
                                                        return;
                                                }

                                                requestAnimFrame(function () {
                                                        scope.$apply(function(){
                                                                scope.value = Math.round(ov);
                                                        });
                                                });

                                                var now = Date.now(),
                                                deltaTime = now - last;

                                                if (deltaTime >= stepDuration) {
                                                        animate(now);
                                                } else {
                                                        setTimeout(function () {
                                                                animate(Date.now());
                                                        }, stepDuration - deltaTime);
                                                }
                                        }
                                        animate(Date.now());
                                }
                        })

                        scope.$on('$destroy', function(){
                                scope.$destroy();
                                element.remove();
                        })
                }
        }
}])

