/* global METAFAD_VIEWER_CONFIG */
(function () {
    'use strict';

    angular
        .module('metaViewerFe')
        .service('MainService', MainService);

    /** @ngInject */
    function MainService($resource, $window) {
        var vm = this;
        vm.serviceProvider = $resource(METAFAD_VIEWER_CONFIG.serverRoot + "/" + ':service/:resource1/:element1', {
            service: '@service',
            resource1: '@resource1',
            element1: '@element1'
        }, {
            get: {
                method: 'GET',
                cache: false
                //withCredentials: true
            },
            getArray: {
                method: 'GET',
                cache: false,
                withCredentials: true,
                isArray: true
            }
        });
        vm.getAppHeight = function () {
            var height;
            if (!METAFAD_VIEWER_CONFIG.externalHeight) {
                var top = angular.element(".viewer")[0].getBoundingClientRect().top;
                height = $window.innerHeight - top;
            }
            else {
                height = METAFAD_VIEWER_CONFIG.viewerHeigh;
            }
            return height;
        };
        var _itemInPage = 24;
        vm.setItemInPage = function (item) {
            _itemInPage = item;
        };
        vm.getItemInPage = function () {
            return _itemInPage;
        };
    }
})();