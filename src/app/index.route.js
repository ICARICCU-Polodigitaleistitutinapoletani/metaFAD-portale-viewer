/* global METAFAD_VIEWER_CONFIG */
(function () {
    'use strict';

    angular
        .module('metaViewerFe')
        .config(routerConfig);

    /** @ngInject */
    function routerConfig($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('main', {
                url: '/main',
                templateUrl: 'app/main/main.html',
                controller: 'MainController',
                controllerAs: 'main'
            })
            .state('main.viewer', {
                url: '/viewer?idMetadato&type',
                templateUrl: 'app/viewer/viewer.html',
                controller: 'ViewerController',
                controllerAs: 'viewer',
                resolve: {
                    objMetadato: ['$q', '$log', '$window', '$stateParams', 'viewerFactory', 'detectItemInPage', 'MainService', '$uiMrFeedback', function ($q, $log, $window, $stateParams, viewerFactory, detectItemInPage, MainService, $uiMrFeedback) {
                        var contentW = $window.innerWidth - 20;
                        var contentH = METAFAD_VIEWER_CONFIG.viewerHeight - 58;
                        var itemInPage = detectItemInPage(contentW, contentH, 170, 216);
                        MainService.setItemInPage(itemInPage);
                        MainService.metadato = $stateParams.idMetadato;
                        MainService.typeMetadato = $stateParams.type;
                        var deferred = $q.defer();
                        if (!$stateParams.idMetadato)
                            deferred.reject("Missing 'idMetadato' or 'type'");
                        var id;
                        var idQuery;
                        if (METAFAD_VIEWER_CONFIG.idType === 'query') {
                            id = '';
                            idQuery = $stateParams.idMetadato;
                        } else {
                            id = $stateParams.idMetadato;
                            idQuery = null;
                        }
                        viewerFactory.getMetadato(id, idQuery, 0, null, $stateParams.type).then(function (data) {
                            deferred.resolve(data);
                        }, function (error) {
                            var feedback = {
                                title: "Attenzione",
                                msg: "C'è stato un problema durante il caricamento dell'oggetto",
                                close: true,
                                closeText: 'Chiudi'
                            };
                            $uiMrFeedback.open(feedback);
                            $log.error(error);
                            deferred.reject(error);
                        });
                        return deferred.promise;
                    }]
                }
            });

        $urlRouterProvider.otherwise('/main');
    }

})();
