(function () {
    'use strict';

    angular
        .module('metaViewerFe')
        .config(config);

    /** @ngInject */
    function config($logProvider, mrFeedbackConfigProvider) {
        // Enable log
        $logProvider.debugEnabled(true);
        mrFeedbackConfigProvider.defaultTheme = "facebook";
    }

})();
