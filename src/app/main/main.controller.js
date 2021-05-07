(function () {
    'use strict';

    angular
        .module('metaViewerFe')
        .controller('MainController', MainController);

    /** @ngInject */
    function MainController($state) {
        var render = function () {
            $state.go("main.viewer");
        };
        render();
    }
})();
