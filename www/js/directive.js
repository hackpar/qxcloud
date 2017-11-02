angular.module('starter.directive', [])
    .directive('hideTabs', function($rootScope, $timeout) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {

                scope.$on('$ionicView.beforeEnter', function() {

                    scope.$watch(attributes.hideTabs, function(value) {
                        //console.log(attributes.hideTabs);
                        $rootScope.hideTabs = 'tabs-item-hide';
                    });
                });

                scope.$on('$ionicView.beforeLeave', function() {
                    scope.$watch(attributes.hideTabs, function(value) {
                        $rootScope.hideTabs = 'tabs-item-hide';
                    });
                    scope.$watch('$destroy', function() {
                        $rootScope.hideTabs = false;
                    })

                });
            }
        };
    })
    
    .directive('scrollHeight', function($window) {
        return {
            restrict: 'AE',
            link: function(scope, element, attr) {
                var offset = ionic.Platform.isAndroid() ? 70 : 64;
                element[0].style.height = ($window.innerHeight - attr.scrollHeight - offset) + 'px';
            }
        };
    })

    .directive('minScrollHeight', function($window) {
        return {
            restrict: 'AE',
            link: function(scope, element, attr) {
                var offset = ionic.Platform.isAndroid() ? 70 : 64;
                element[0].style.minHeight = ($window.innerHeight - attr.minScrollHeight - offset) + 'px';
            }
        };
    })

    .directive('loginViewTranslate', function($rootScope, $ionicPlatform, $timeout, $ionicHistory, $cordovaKeyboard) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {
                window.addEventListener('native.keyboardshow', function(e) {
                    angular.element(element).css({
                        'top': '10%'
                    });
                });
                window.addEventListener('native.keyboardhide', function(e) {
                    angular.element(element).css({
                        'top': '20%'
                    });
                    cordova.plugins.Keyboard.isVisible = true;
                    $timeout(function() {
                        cordova.plugins.Keyboard.isVisible = false;
                    }, 100);
                });
            }
        };
    })

    .directive('focusInput', function($window, $ionicPlatform, $timeout, $ionicHistory, $cordovaKeyboard) {
        return {
            restrict: 'A',
            link: function(scope, element, attributes) {
                var popup = angular.element(element).parent().parent();
                var winHeight = $window.innerHeight;
                popup.css({
                    top: '0',
                    position: 'relative',
                    transition: 'all .2s ease .2s'
                });
                element.on('focus', function() {
                    window.addEventListener('native.keyboardshow', function(e) {
                        var top = (winHeight - e.keyboardHeight - 160) / 2;
                        popup.css({
                            top: -top + 'px',
                        });
                    });
                    window.addEventListener('native.keyboardhide', function(e) {
                        popup.css({
                            top: '0'
                        });
                        cordova.plugins.Keyboard.isVisible = true;
                        $timeout(function() {
                            cordova.plugins.Keyboard.isVisible = false;
                        }, 100);
                    });
                })
            }
        };
    })

    .directive('dynamic', ['Public', function(Public) {
        return {
            restrict: 'A',
            replace: true,
            link: function(scope, element, attrs) {
                scope.$watch(attrs.dynamic, function(html) {
                    if(!html) return;
                    MathJax.Hub.Config({
                        showProcessingMessages: false,
                        messageStyle: 'none',
                        jax: ['input/TeX', 'output/HTML-CSS'],
                        extensions: ['tex2jax.js'],
                        tex2jax: { 
                            inlineMath: [['$', '$'],['\\(', '\\)']],
                            processEscapes: true
                        },
                        'HTML-CSS': {
                            linebreaks: { automatic: true, width: '90% container' },
                            availableFonts: ['TeX'],
                            processEscapes: true,
                            showMathMenu: false,
                            styles: {
                                '.MJXc-display': {
                                    display: 'inline-block',
                                    width: 'initial',
                                    margin: '0 0',
                                    padding: '10px 0 0',
                                    'vertical-align': 'middle'
                                }
                            }
                        },
                        displayAlign: 'left'
                    });
                    if (html === null || html === undefined) return;
                    html = html.replace(/\$\$([^$]+)\$\$/g, "<span class=\"red\"><script type='math/tex'>$1</script></span>");
                    // html = html.replace(/\$([^$]+)\$/g, "<span class=\"red\"><script type='math/tex'>$1</script></span>");
                    html = html.replace(/\$([^$]+)\$/g, "<span class=\"red\"><script type='math/tex'>\$1</script></span>");
                    html = html.replace(/&nbsp;/g, " ").replace(/\<br\/\>/g, '')
                    var arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"'};
                    html = html.replace(/&(lt|gt|nbsp|amp|quot);/ig, function(all, t) { return arrEntities[t]; });
                    element.html(html);
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, element[0]]);
                });
            }
        };
    }])
