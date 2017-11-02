angular.module('starter.factories', [])

    /**
     * [GET POST请求 错误处理]
     * @param  {[type]} $q        [description]
     * @param  {[type]} $http     [description]
     * @param  {Object} $timeout) {                   var error_info [description]
     * @return {[type]}           [description]
     */
    .factory('Reference', ['$q', '$http', '$timeout', '$state', 'Config', 'AuthService', 'Public', function($q, $http, $timeout, $state, Config, AuthService, Public) {
        // 请求数据地址配置
        var evn = Config.evn;

        var h = evn ? Config.host : Config.testHost;

        var error_info = Config.error;

        var handleBaseError = function(error) {
            // todo...接入提示 toast
            angular.forEach(error_info, function(msg, e) {
                if (e == error) {
                    Public.Toast(msg);
                }
                if (error == 3001 || error == 3002) {
                    $state.go('login');
                    AuthService.removeAuthInfo();
                }
            })
        }

        var handleError = function(error, func) {
            if (error.err_code) {
                func && angular.isFunction(func) && func.call(null, error) !== true && handleBaseError(error.err_code)
            } else {
                handleBaseError(error.status)
            }
        }

        var post = function(options) {
            var defer = $q.defer();
            var url = options.url;
            var params = options.params;
            angular.extend(params, {
                access_token: AuthService.getToken()
            });
            $http({
                method: 'post',
                data: params,
                url: h + url,
                timeout: 15e3
            }).then(function(data) {
                defer.resolve(data);
            }, function(e) {
                handleError(e, angular.noop)
                defer.reject(e);
            });
            return defer.promise;
        }

        var get = function(options) {
            var defer = $q.defer();
            var url = options.url;
            var params = options.params;
            angular.extend(params, {
                access_token: AuthService.getToken()
            });
            $http({
                method: 'get',
                params: params,
                url: h + url,
                timeout: 15e3
            }).then(function(data) {
                defer.resolve(data);
            }, function(e) {
                handleError(e, angular.noop)
                defer.reject(e);
            });
            return defer.promise;
        }
        return {
            get: get,
            post: post
        }
    }])

    /**
     * [cookie factory]
     * @param  {[type]} )   {  var cookies [description]
     * @param  {[type]} null [description]
     * @return {[type]}      [description]
     */
    .factory('Cookies', [function() {
        var cookies = function(name, value, options) {
            if ("undefined" == typeof value) {
                var cookieValue = null;
                if (document.cookie && "" != document.cookie)
                    for (var cookies = document.cookie.split(";"), i = 0; i < cookies.length; i++) {
                        var cookie = cookies[i].replace(/(^\s*)|(\s*$)/g, '');
                        if (cookie.substring(0, name.length + 1) == name + "=") {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break
                        }
                    }
                return cookieValue
            }
            options = options || {},
                null === value && (value = "", options.expires = -1);
            var expires = "";
            if (options.expires && ("number" == typeof options.expires || options.expires.toUTCString)) {
                var date;
                "number" == typeof options.expires ? (date = new Date, date.setTime(date.getTime() + 24 * options.expires * 60 * 60 * 1e3)) : date = options.expires,
                    expires = "; expires=" + date.toUTCString()
            }
            var path = options.path ? "; path=" + options.path : "",
                domain = options.domain ? "; domain=" + options.domain : "",
                secure = options.secure ? "; secure" : "";
            document.cookie = [name, "=", encodeURIComponent(value), expires, path, domain, secure].join("")
        };
        return {
            get: function(name) {
                return cookies(name)
            },
            remove: function(name) {
                return cookies(name, null)
            },
            set: function(name, value, opt) {
                return cookies(name, value, opt || {
                    expires: 1,
                    path: "/"
                })
            }
        }
    }])

    /**
     * [登录认证信息]
     * @param  {[type]} Config    [description]
     * @param  {[type]} Reference [description]
     * @return {[type]}           [description]
     */
    .factory('AuthService', ['Config', 'Cookies', '$localStorage', function(Config, Cookies, $localStorage) {
        return {
            authInfo: new Object(),
            cookie_key: 'cloud',
            setAuthInfo: function(data) {
                $localStorage.$default(this.authInfo);
                if (data && data.data) {
                    var limit_time = 30;
                    angular.forEach(data.data, function(value, key) {
                        this.authInfo[key] = value;
                    }, this)
                    if ($localStorage.$supported()) {
                        $localStorage.$reset(this.authInfo);
                    } else {
                        Cookies.set(this.cookie_key, JSON.stringify(this.authInfo), {
                            expires: limit_time
                        })
                    }
                }
            },

            getAuthInfo: function() {
                return $localStorage;
            },

            removeAuthInfo: function() {
                $localStorage.$reset();
            },

            updateAuthInfo: function(data) {
                if (data && angular.isObject(data)) {
                    angular.forEach(data.data, function(value, key) {
                        $localStorage[key] = value;
                    }, this)
                }
            },

            getToken: function() {
                return $localStorage.access_token || '';
            },

            isLogin: function() {
                return !!$localStorage.access_token || '';
            }
        }
    }])

    .factory('UploadImg', function($ionicActionSheet, $cordovaCamera, $cordovaActionSheet, Request, Config, AuthService, $localStorage, $cordovaFileTransfer, Public, $ionicLoading, $cordovaFileTransfer, $cordovaFile, $localStorage, $location) {

        return {
            //显示
            show: function(success, error) {
                var upload = function(result) { // 0: camera   1: picture

                    $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner><br>正在加载，请稍候...'
                    });
                    if (result === 0) {
                        ImageProcess.openCamera('', function(result) {
                            $ionicLoading.hide();
                            upImage(result);
                        }, function(data) {
                            $ionicLoading.hide();
                        });
                    } else {
                        var source = Camera.PictureSourceType.PHOTOLIBRARY;
                        var options = {
                            quality: 60,
                            destinationType: 1,
                            sourceType: source,
                            allowEdit: false,
                            EncodingType: 1,
                            mediaType: 0,
                            cameraDirection: 0,
                            popoverOptions: CameraPopoverOptions,
                            saveToPhotoAlbum: true
                        };

                        $cordovaCamera.getPicture(options).then(function(imageData) {
                            if (ionic.Platform.isAndroid()) {
                                FilePath.resolveNativePath(imageData, function(res) {
                                    res = res.replace(/\?=.*/g, '');
                                    ImageProcess.openCrop('', res, function(result) {
                                        upImage(result);
                                    }, function(data) {
                                        $ionicLoading.hide();
                                    });
                                });
                            } else {
                                ImageProcess.openCrop("", imageData, function(result) {
                                    upImage(result);
                                }, function(data) {
                                    $ionicLoading.hide();
                                });
                            }
                        }, function(err) {
                            $ionicLoading.hide();
                        }).finally(function() {
                            $ionicLoading.hide();
                        });
                    }


                    var upImage = function(imagePath) {
                        var path, name, filePattern;
                        filePattern = imagePath.match(/^(.*)\/([^/].*)$/);

                        if (!filePattern) return;

                        $ionicLoading.show({
                            template: '<ion-spinner></ion-spinner><br>正在上传...'
                        })

                        path = filePattern[1];
                        name = filePattern[2];
                        $cordovaFile.readAsDataURL(path, name)
                        .then(function(data) {
                            var base64 = [];
                            if (data) {
                                base64 = data.split(',');
                                Request.UploadImgBase64({
                                    file: base64[1],
                                    file_ext: 'jpg'
                                }).then(function(result) {
                                    $ionicLoading.hide();
                                    success(result.url);
                                });
                            }
                        }, function() {
                            $ionicLoading.hide();
                            Public.Toast(Config.error[3005]);
                        }).finally(function() {

                            $cordovaFile.checkFile(path + '/', name)
                            .then(function(result) {
                                $cordovaFile.removeFile(path, name);
                            })
                        })
                    };
                };

                Public.ActionSheet(upload);
            }
        };
    })


    .factory('ExtractImg', function($rootScope, $ionicActionSheet, $cordovaCamera, $cordovaActionSheet, Request, Config, $localStorage, $cordovaFileTransfer, $ionicLoading, Public) {
        return {
            //显示
            show: function(success, error) {
                var source = function(resp) {
                    var source;
                    if (resp === 0) {
                        source = Camera.PictureSourceType.CAMERA;
                    } else {
                        source = Camera.PictureSourceType.PHOTOLIBRARY;
                    }
                    var options = {
                        quality: 60,
                        destinationType: 1,
                        sourceType: source,
                        allowEdit: false,
                        encodingType: Camera.EncodingType.JPEG,
                        mediaType: 0,
                        cameraDirection: 1,
                        popoverOptions: CameraPopoverOptions,
                        saveToPhotoAlbum: false
                    };
                    $cordovaCamera.getPicture(options).then(function(imageData) {
                        $ionicLoading.show({
                            template: '<ion-spinner></ion-spinner><br>正在加载，请稍候...'
                        });
                        if (ionic.Platform.isAndroid()) {
                            window.FilePath.resolveNativePath(imageData, function(res) {

                                lrz(res)
                                    .then(function(rst) {
                                        $ionicLoading.hide();
                                        success({ url: rst.base64 });
                                        // 处理成功会执行
                                    })
                                    .catch(function(err) {
                                        $ionicLoading.hide();
                                        error('请选择一张图片', false);
                                        // 处理失败会执行
                                    });
                            });
                        } else {
                            lrz(imageData)
                                .then(function(rst) {
                                    $ionicLoading.hide();
                                    success({ url: rst.base64 });
                                    // 处理成功会执行
                                })
                                .catch(function(err) {
                                    $ionicLoading.hide();
                                    error('请选择一张图片', false);
                                    // 处理失败会执行
                                });
                        }
                    }, function(err) {
                        error('请选择一张图片', false);
                    });
                };
                Public.ActionSheet(source);
            }
        };
    })



    //这里写公共方法
    .factory('Public', function($cordovaToast, $ionicActionSheet, $ionicPopup, $cordovaActionSheet, $timeout, $rootScope, $cordovaSplashscreen, $ionicPlatform, $interval, $ionicLoading) {

        return {
            Toast: function(msg) {
                if (ionic.Platform.navigator.platform == 'Win32') {
                    console.log(msg);
                    return;
                }
                $cordovaToast.showWithOptions({
                    message: msg,
                    duration: "short",
                    position: "bottom",
                    addPixelsY: ionic.Platform.isAndroid() ? -160 : -80
                });
            },

            ToastTop: function(msg) {
                if (ionic.Platform.navigator.platform == 'Win32') {
                    console.log(msg);
                    return;
                }
                $cordovaToast.showWithOptions({
                    message: msg,
                    duration: "short",
                    position: "center",
                    addPixelsY: ionic.Platform.isAndroid() ? -160 : -50
                });
            },

            formatSeconds: function(s) {
                var t = '';
                if (s > -1) {
                    var min = Math.floor(s / 60) % 60;
                    var sec = s % 60;

                    if (min < 10) { t += "0"; }
                    t += min + ":";
                    if (sec < 10) { t += "0"; }
                    t += sec;
                }
                return t;
            },

            formatTime: function(time, format) {
                time = new Date(time);
                format = format || 'MM-dd-hh:mm'
                var args = {
                    "M+": time.getMonth() + 1,
                    "d+": time.getDate(),
                    "h+": time.getHours(),
                    "m+": time.getMinutes(),
                    "s+": time.getSeconds(),
                };
                if (/(y+)/.test(format))
                    format = format.replace(RegExp.$1, (time.getFullYear() + "").substr(4 - RegExp.$1.length));
                for (var i in args) {
                    var n = args[i];
                    if (new RegExp("(" + i + ")").test(format))
                        format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? n : ("00" + n).substr(("" + n).length));
                }
                return format;
            },

            showImg: function(list, num, $scope) {
                if (!num) num = 0;
                $ionicLoading.show({
                    template: '<ion-spinner></ion-spinner><br>正在加载，请稍候...'
                });
                // build items array
                var pswpElement = document.querySelectorAll('.pswp')[0];
                var items = [];
                for (var s in list) {

                    var i = new Image();
                    i.src = list[s];
                    i.onload = function() {
                        var rw = this.width;
                        var rh = this.height;
                        items.push({
                            src: this.src,
                            w: rw,
                            h: rh
                        });
                        i = null;
                    }
                    i.onerror = function() {
                        $ionicLoading.hide();
                    }
                }

                var nums = list.length;
                var inter = $interval(function() {
                    if (items.length === nums) {
                        var options = {
                            // history & focus options are disabled on CodePen
                            history: false,
                            focus: false,
                            showAnimationDuration: 0,
                            hideAnimationDuration: 0
                        };
                        $rootScope.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);

                        $rootScope.gallery.init();
                        document.getElementsByTagName("ion-nav-view")[0].className = 'view-container alwaysTop';
                        $ionicLoading.hide();
                        $rootScope.gallery.goTo(num);
                        var deregister = $ionicPlatform.registerBackButtonAction(function(e) {
                            $rootScope.gallery.close();
                            return false;
                        }, 101);
                        $rootScope.gallery.listen('close', function() {
                            $scope.showImgBox = false;
                            document.getElementsByTagName("ion-nav-view")[0].className = 'view-container';
                            deregister();
                        });

                        $interval.cancel(inter);
                    }
                }, 100);
            },


            TestType: function(test_type) {
                switch (test_type) {
                    case 1:
                        test_type = '单选题';
                        break;
                    case 2:
                        test_type = '多选题';
                        break;
                    case 3:
                        test_type = '解答题';
                        break;
                }
                return test_type;
            },

            AnswerType: function(answer_type) {
                switch (answer_type) {
                    case 1:
                        answer_type = '正确';
                        break;
                    case 2:
                        answer_type = '错误';
                        break;
                    case 3:
                        answer_type = '20%正确';
                        break;
                    case 4:
                        answer_type = '50%正确';
                        break;
                    case 5:
                        answer_type = '80%正确';
                        break;
                    case 0:
                        answer_type = '待批阅';
                        break;
                }
                return answer_type;
            },


            unique: function(arr) {
                var res = [];
                var json = {};
                for (var i = 0; i < arr.length; i++) {
                    if (!json[arr[i]]) {
                        res.push(arr[i]);
                        json[arr[i]] = 1;
                    }
                }
                return arr;
            },


            removeByValue: function(arr, val) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] == val) {
                        arr.splice(i, 1);
                        break;
                    }
                }
            },

            ActionSheet: function(option, cb) {

                var options = {
                    buttonLabels: ['拍照', '从相册选择'],
                    addCancelButtonWithLabel: '取消',
                    androidEnableCancelButton: true,
                    winphoneEnableCancelButton: true
                };
                if (typeof option == 'function') {
                    cb = option;
                } else {
                    angular.extend(options, option || {});
                }
                if (ionic.Platform.isAndroid()) {
                    $ionicActionSheet.show({
                        buttons: [
                            { text: options.buttonLabels[0] },
                            { text: options.buttonLabels[1] }
                        ],
                        cancelText: '取消',
                        buttonClicked: function(index) {
                            cb(index);
                            return true;
                        }
                    });

                } else {

                    document.addEventListener("deviceready", function() {
                        $cordovaActionSheet.show(options)
                            .then(function(btnIndex) {
                                switch (btnIndex) {
                                    case 1:
                                        cb(0);
                                        break;

                                    case 2:
                                        cb(1);
                                        break;

                                    default:
                                        break;
                                }
                            });
                    }, false);

                }
            },
            confirm: function(content, cb) {
                var showConfirm = function() {
                    var confirmPopup = $ionicPopup.confirm({
                        title: '温馨提示',
                        template: content,
                        okText: '确认',
                        cancelText: '取消',
                        cancelType: 'button-clear',
                        okType: 'button-clear'
                    });
                    confirmPopup.then(function(res) {
                        if (res) {
                            cb(res);
                        } else {
                            cb(null);
                        }
                    });
                };
                showConfirm();
            },

            Modal: function(option, cb) {
                var showPopup = $ionicPopup.show({
                    title: option.title,
                    cssClass: option.cssClass,
                    subTitle: option.subTitle,
                    template: option.template,
                    templateUrl: option.templateUrl,
                    scope: option.scope,
                    buttons: [{
                        text: '确认',
                        type: 'button-clear ensure',
                        onTap: function(e) {
                            if (angular.isFunction(option.ensure) && !option.ensure()) {
                                return e.preventDefault();
                            }
                            return option.scope || true;
                        }
                    }, {
                        text: '取消',
                        type: 'button-clear',
                        onTap: function(e) {
                            //e.preventDefault();
                        }
                    }]
                });
                showPopup.then(function(res) {
                    if (res) {
                        cb(res);
                    } else {
                        cb(null);
                    }
                });
            },

            bootstrap: function() {

                $ionicPlatform.ready(function() {
                    if (ionic.Platform.isAndroid()) {
                        $timeout(function() {
                            $rootScope.animate = true;
                            var hideAnimate = setInterval(function() {
                                navigator.splashscreen.status(function(res) {
                                    if (res == 'true') {
                                        $cordovaSplashscreen.hide();
                                        clearInterval(hideAnimate);
                                    }
                                });
                            }, 100);
                        }, 100);
                    } else {

                        $timeout(function() {
                            $rootScope.animate = true;
                            var hideAnimate = setInterval(function() {
                                navigator.splashscreen.status(function(res) {
                                    console.log('test::::', res);
                                    if (res == true) {
                                        $cordovaSplashscreen.hide();
                                        clearInterval(hideAnimate);
                                    }
                                });
                            }, 100);
                        }, 100);
                    }
                });
            },
            
            loadJs: function (id, url, callback) {
                var nodeHead = document.getElementsByTagName('head')[0];
                var nodeScript = null;
                if (document.getElementById(id) == null) {
                    nodeScript = document.createElement('script');
                    nodeScript.setAttribute('type', 'text/javascript');
                    nodeScript.setAttribute('src', url);
                    nodeScript.setAttribute('id', id);
                    if (callback != null) {
                        nodeScript.onload = nodeScript.onreadystatechange = function() {
                            if (nodeScript.ready) {
                                return false;
                            }
                            if (!nodeScript.readyState || nodeScript.readyState == "loaded" || nodeScript.readyState == 'complete') {
                                nodeScript.ready = true;
                                callback();
                            }
                        }
                    }
                    nodeHead.appendChild(nodeScript);
                } else {
                    callback && callback();
                }
            }
        }
    })


    .factory('eventEmitter', [function(){
            function evtEmitter() {}
            evtEmitter.prototype = {
                constructor: evtEmitter,

                on: function(eventName, listener) {
                    if (!eventName || !listener) {
                        return;
                    }
                    var events = this._events = this._events || {};
                    var listeners = events[eventName] = events[eventName] || [];
                    if (listeners.indexOf(listener) == -1) {
                        listeners.push(listener);
                    }
                    return this;
                },

                off: function(eventName, listener) {
                    var listeners = this._events && this._events[eventName];
                    if (!listeners || !listeners.length) {
                        return;
                    }
                    var index = listeners.indexOf(listener);
                    if (index != -1) {
                        listeners.splice(index, 1);
                    }

                    return this;
                },

                once: function(eventName, listener) {
                    if (!eventName || !listener) {
                        return;
                    }
                    this.on(eventName, listener);
                    var onceEvents = this._onceEvents = this._onceEvents || {};
                    var onceListeners = onceEvents[eventName] = onceEvents[eventName] || {};
                    onceListeners[listener] = true;
                    return this;
                },

                emitEvent: function(eventName, params) {
                    var listeners = this._events && this._events[eventName];
                    if (!listeners || !listeners.length) {
                        return;
                    }
                    listeners = listeners.slice(0);
                    params = params || [];
                    var onceListeners = this._onceEvents && this._onceEvents[eventName];

                    for (var i = 0; i < listeners.length; i++) {
                        var listener = listeners[i]
                        var isOnce = onceListeners && onceListeners[listener];
                        if (isOnce) {
                            this.off(eventName, listener);
                            delete onceListeners[listener];
                        }
                        listener.apply(this, params);
                    }
                    return this;
                }
            }
            return evtEmitter;

    }])

    .factory('imagesLoaded', ['$q', 'eventEmitter', function($q, eventEmitter){

            var elementNodeType = {
                    1: true, 9: true
            }

            var makeArray = function(obj){
                    var result = [];
                    if(Array.isArray(obj)){
                            result = obj;
                    }else if(typeof obj.length == 'number'){
                            for(var i = 0; i<obj.length; i++){
                                    result.push(obj[i]);
                            }
                    }else {
                            result.push(obj);
                    }
                    return result;
            }

            var ImagesLoaded = function(element, options, fn){

                    if(!(this instanceof ImagesLoaded)){
                            return new ImagesLoaded(element, options);
                    }
                    this.elements = makeArray(element);
                    this.options = angular.extend(this.options, options);
                    //console.log(this.elements)

                    if(angular.isFunction(options)){
                            fn = options;
                    }else {
                            angular.extend(this.options, options);
                    }

                    if(fn) {
                            this.on('image:complete', fn);
                    }
                    this.defer = $q.defer();

                    this.getImages();

                    setTimeout(function(){
                            this.check()
                    }.bind(this), 0);
            }

            ImagesLoaded.prototype = Object.create(eventEmitter.prototype);

            ImagesLoaded.prototype.getImages = function(){
                    this.images = [];
                    angular.forEach(this.elements, this.addElementImage, this);
            }
            ImagesLoaded.prototype.addElementImage = function(element, index){
                    //console.log(element)
                    if(element.nodeName == 'IMG'){
                            this.addImage(element);
                    }

                    var nodeType = element.nodeType;
                    if(!nodeType || !elementNodeType[nodeType]){
                            return;
                    }

                    var childImg = angular.element(element).find('img');
                    //console.log(childImg.length)
                    for(var i=0; i<childImg.length; i++){
                            var img = childImg[i];
                            this.addImage(img);
                    }
            }

            ImagesLoaded.prototype.addImage = function(image){
                    var loadingImage = new LoadingImage(image);
                    this.images.push(loadingImage);
            }

            ImagesLoaded.prototype.check = function(){
                    var self = this;
                    this.progressCount = 0;
                    this.hasAnyBroken = false;

                    if(!this.images.length){
                            return this.complete();
                    }

                    var progressHandle = function(image, elem, msg){
                            setTimeout(function(){
                                    self.progressHandle(image, elem, msg);
                            }, 0)
                    }

                    angular.forEach(this.images, function(loadingImage, index){
                            //console.log(loadingImage)
                            loadingImage.once('image:progress', progressHandle);
                            loadingImage.check();
                    })
            }

            ImagesLoaded.prototype.progressHandle = function(image, elem, msg){
                    this.progressCount++;
                    this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;

                    this.emitEvent('image:progress', [this, image, elem]);
                    this.defer && this.defer.notify(this, image);

                    if(this.progressCount == this.images.length){
                            this.complete();
                    }
                    //console.log(image, elem, msg)
            }

            ImagesLoaded.prototype.complete = function(){
                    this.isComplete = true;
                    var event = this.hasAnyBroken ? 'image:fail' : 'image:done';
                    this.emitEvent(event, [this]);
                    this.emitEvent('image:loadend', [this]);
                    this.defer[this.hasAnyBroken ? 'resolve' : 'reject']();
            }

            ImagesLoaded.prototype.options = {};


            function LoadingImage(image){
                    this.image = image;
            }

            LoadingImage.prototype = Object.create(eventEmitter.prototype);

            LoadingImage.prototype.check = function(){
                    var isComplete = this.isLoadComplete();

                    if(isComplete){
                            this.ensureComplete(this.image.naturalWidth !== 0, 'naturalWidth');
                            return;
                    }

                    this._image = new Image();
                    this._image.addEventListener('load', this);
                    this._image.addEventListener('error', this);

                    this.image.addEventListener('load', this);
                    this.image.addEventListener('error', this);
                    this._image.src = this.image.src;
            }

            LoadingImage.prototype.isLoadComplete = function(){
                    return this.image.complete && this.image.naturalWidth !== 'undefined';
            }

            LoadingImage.prototype.ensureComplete = function(isLoaded, message){
                    this.isLoaded = isLoaded;
                    this.emitEvent('image:progress', [this, this.image, message]);
            }


            LoadingImage.prototype.handleEvent = function(event){
                    var method = 'on' + event.type;
                    if(this[method]){
                            this[method](event);
                    }
            }

            LoadingImage.prototype.onload = function(evt){
                    this.ensureComplete(true, 'onload');
                    this.destroy();
            }

            LoadingImage.prototype.onerror = function(evt){
                    this.ensureComplete(true, 'onerror');
                    this.destroy();
            }

            LoadingImage.prototype.destroy = function(evt){
                    this._image.removeEventListener('load', this);
                    this._image.removeEventListener('error', this);
                    this.image.removeEventListener('load', this);
                    this.image.removeEventListener('error', this);
            }

            return ImagesLoaded;
    }])


    .directive('imgLoaded', ['imagesLoaded', 'Public', function(imagesLoaded, Public){
            return {
                    restrict: 'A',
                    controller: '',
                    require: '?ngModel',

                    link: function(scope, element, attr){

                            //console.log(imagesLoaded.prototype)
                            var url = '';
                            var eventHandle = angular.noop;
                            var reLoadImg = function(img){
                                    if(img && img.nodeType){console.log(img)
                                            img.title = '[图片加载失败, 点击重新加载]';
                                            clickHandle = function(){console.log('reload img')
                                                    url = this.src;
                                                    if(url.indexOf('?=')>-1){
                                                        this.src = url.split('?=')[0] + '?='+ Math.random();
                                                    }else{
                                                        this.src = url + '?='+ Math.random();
                                                    }
                                            }
                                            img.removeEventListener('click', clickHandle, false);
                                            img.addEventListener('click', clickHandle, false);
                                    }
                            }

                            scope.$watch(attr.imgLoaded, function(nv, ov){
                                    //console.log(nv, ov, attr.imgLoaded)
                                    if(nv && nv !== ov){
                                            new imagesLoaded( element[0], function(context){
                                                    console.log('all images loaded success');
                                            })
                                            .on('image:fail', function(context){
                                                    Public.Toast('试题加载错误, 请尝试重新加载');
                                            })
                                            .on('image:progress', function(context, image){
                                                    if(!image.isLoaded){
                                                            var img = image.image;
                                                            //reLoadImg(img);
                                                    }
                                            })
                                    }
                            }, true)
                    }
            }
    }])
