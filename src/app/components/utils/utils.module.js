/* global $ */
(function () {
    'use strict';
    angular.module("utilsMdl", [
    ])
        .factory('refreshAngularCircle', function () {
            return function ($scope) {
                if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                    $scope.$apply();
                }
            }
        })
        .factory('detectItemInPage', function () {
            return function (contW, contH, itemW, itemH) {
                var itemInW = parseInt(contW / itemW);
                var itemInH = parseInt(contH / itemH) + 1;
                var itemInPage = itemInW * itemInH;
                return itemInPage;
            }
        })
        .filter('range', function () {
            return function (input, total) {
                total = parseInt(total);

                for (var i = 0; i < total; i++) {
                    input.push(i);
                }

                return input;
            };
        })
        .factory('mergeArrayUnique', function () {
            return function (array) {
                var a = array.concat();
                for (var i = 0; i < a.length; ++i) {
                    for (var j = i + 1; j < a.length; ++j) {
                        if (a[i] === a[j])
                            a.splice(j--, 1);
                    }
                }
                return a;
            }
        })
        .directive('detectScrollEnd', function ($rootScope) {
            return {
                restrict: 'A',
                link: function (scope, element) {
                    var raw = element[0];
                    var eventCalled = false;
                    var scrollPos;
                    element.bind('scroll', function () {
                        if (scrollPos && raw.scrollTop < scrollPos) {
                            return;
                        }
                        scrollPos = raw.scrollTop;
                        if (raw.scrollTop + raw.offsetHeight + (raw.clientHeight - 100) >= raw.scrollHeight) { //at the bottom
                            if (!eventCalled) {
                                eventCalled = true;
                                $rootScope.$broadcast("detectScrollEnd:bottom");
                                setTimeout(function () {
                                    eventCalled = false;
                                }, 700);
                            }
                        }
                    })
                }
            }
        })
        .directive('checkEndResize', function ($rootScope) {
            return {
                restrict: 'A',
                link: function (scope) {
                    var rtime;
                    var timeout = false;
                    var delta = 200;
                    $(window).resize(function () {
                        rtime = new Date();
                        if (timeout === false) {
                            timeout = true;
                            setTimeout(resizeend, delta);
                        }
                    });

                    function resizeend() {
                        if (new Date() - rtime < delta) {
                            setTimeout(resizeend, delta);
                        } else {
                            timeout = false;
                            $rootScope.$broadcast("checkEndResize");
                        }
                    }
                }
            }
        })
        .service('serviceUUID', function () {
            this.create = function () {
                var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
                uuid = uuid.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                return uuid;
            };
        })
        .directive('ngRightClick', function ($parse) {
            return function (scope, element, attrs) {
                var fn = $parse(attrs.ngRightClick);
                element.bind('contextmenu', function (event) {
                    scope.$apply(function () {
                        event.preventDefault();
                        if (fn)
                            fn(scope, { $event: event });
                    });
                });
            };
        })
        .directive('setDraggable', function ($document) {
            return function (scope, element) {
                var startX, startY, x = 0, y = 0,
                    start, stop, drag, container, enabled, zoom;

                var width = element[0].offsetWidth,
                    height = element[0].offsetHeight;

                if (scope.dragOptions) {
                    start = scope.dragOptions.start;
                    drag = scope.dragOptions.drag;
                    stop = scope.dragOptions.stop;
                    var id = scope.dragOptions.container;
                    if (id) {
                        container = document.getElementById(id).getBoundingClientRect();
                    }
                }

                element.css({
                    position: "relative"
                });

                element.on('mousedown', function (e) {
                    e.preventDefault();
                    zoom = element[0].style.zoom ? parseFloat(element[0].style.zoom) : 0;
                    startX = e.clientX;
                    startY = e.clientY;
                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                    if (start) start(e);
                });

                function mousemove(e) {
                    y = (e.clientY - startY) / zoom;
                    x = (e.clientX - startX) / zoom;
                    setPosition();
                    if (drag) drag(e);
                }

                function mouseup(e) {
                    $document.unbind('mousemove', mousemove);
                    $document.unbind('mouseup', mouseup);
                    if (stop) stop(e);
                }

                function setPosition() {
                    if (!enabled)
                        return;
                    if (container) {
                        if (x < container.left) {
                            x = container.left;
                        } else if (x > container.right - width) {
                            x = container.right - width;
                        }
                        if (y < container.top) {
                            y = container.top;
                        } else if (y > container.bottom - height) {
                            y = container.bottom - height;
                        }
                    }

                    element.css({
                        top: y + 'px',
                        left: x + 'px'
                    });
                }

                scope.$on("setDraggable:enable", function (event, enable) {
                    enabled = enable;
                    if (enabled) {
                        element.css({
                            cursor: "move"
                        })
                    }
                    else {
                        element.css({
                            cursor: "auto"
                        })
                    }
                })
            };
        });
})();