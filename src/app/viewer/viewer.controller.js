/* global $, _, METAFAD_VIEWER_CONFIG */
(function() {
    'use strict';

    angular
        .module('metaViewerFe')
        .controller('ViewerController', ViewerController);

    /** @ngInject */
    function ViewerController($rootScope, $log, $window, $scope, viewerFactory, MainService, objMetadato, detectItemInPage, serviceUUID, LoadingService, $uiMrFeedback) {
        var vm = this;
        var itemToLoad = 0;
        var render = function(){
            var medias = prepareDataForViewer(objMetadato);
            vm.MetaMediaViewer.medias=[];
            vm.MetaMediaViewer.index=medias.index;
            vm.MetaMediaViewer.info = medias.info;
            vm.MetaMediaViewer.medias = vm.MetaMediaViewer.medias.concat(medias.medias);
            vm.MetaMediaViewer.tot=medias.tot;
            vm.MetaMediaViewer.itemInPage=medias.itemInPage;
            vm.MetaMediaViewer.mediasGrid = medias.medias.length > medias.itemInPage ? _.clone(medias.medias).slice(0,medias.itemInPage) : _.clone(medias.medias);
            vm.MetaMediaViewer.title=medias.title;
            vm.MetaMediaViewer.show=true;
            itemToLoad+=vm.MetaMediaViewer.mediasGrid.length;
        };
        
        var resizeDoResize = $(window).on("resize.doResize", function (){
            $scope.$apply(function(){
                vm.MetaMediaViewer.options.height = MainService.getAppHeight() + "px";
            });

        });
        
        vm.MetaMediaViewer = {
            show:false,
            options:{
                modal:false,
                theme:"light",
                height: MainService.getAppHeight() + "px"
            },
            medias:[]
        };
        
        var prepareDataForViewer = function(obj){
            var mediaViewer = {};
            mediaViewer.title = obj.title;
            mediaViewer.index = obj.logicalSTRU;
            mediaViewer.info = obj.info;
            mediaViewer.medias = [];
            _.forEach(obj.physicalSTRU.image,function(value){
                var obj = {
                    "id":value.id || serviceUUID.create(),
                    "thumbnail":value.thumbnail,
                    "title":value.title,
                    "type": value.type.toUpperCase(),
                    "url":value.src || value.url,
                    "tile":value.tile,
                    "keyNode":value.keyNode,
                    "aliasKeyNode": value.aliasKeyNode,
                    "label":value.label
                };
                mediaViewer.medias.push(obj);
            });
            mediaViewer.tot = obj.physicalSTRU.tot;
            mediaViewer.totFolder = obj.physicalSTRU.totFolder;
            mediaViewer.itemInPage = MainService.getItemInPage();
            return mediaViewer;
        };
        var getMetadato = function(init,num,keyNode,type){
            var type=MainService.typeMetadato;
            var end = num || itemToLoad;
            var id;
            var idQuery;
            if (METAFAD_VIEWER_CONFIG.idType === 'query') {
                id = '';
                idQuery = MainService.metadato;
            } else {
                id = MainService.metadato;
                idQuery = null;
            }
            viewerFactory.getMetadato(id,idQuery,init,end,type,keyNode).then(function(response) {
                var medias = prepareDataForViewer(response);
                if(type)
                    vm.MetaMediaViewer[type] = medias.medias;
                else
                    vm.MetaMediaViewer.medias = medias.medias;
                vm.MetaMediaViewer.tot=medias.tot;
                itemToLoad=vm.MetaMediaViewer.itemInPage;
            }, function(error) {
                var feedback = {
                    title: "Attenzione",
                    msg: "C'è stato un problema durante il caricamento dell'oggetto",
                    close: true,
                    closeText: 'Chiudi'
                };
                $uiMrFeedback.open(feedback);
                $log.error(error);
            });
        };
        var metaMediaViewerGetMetadato = $scope.$on("metaMediaViewer:getMetadato",function(e,init,num,keyNode,type){
            getMetadato(init,num,keyNode);
        });
        var loading=false;
        var getNextPage = function(keyNode,mediaType){
            if(loading)
                return;
            loading=true;
            var type=MainService.typeMetadato;
            var id;
            var idQuery;
            if (METAFAD_VIEWER_CONFIG.idType === 'query') {
                id = '';
                idQuery = MainService.metadato;
            } else {
                id = MainService.metadato;
                idQuery = null;
            }
            viewerFactory.getMetadato(id,idQuery,itemToLoad,vm.MetaMediaViewer.itemInPage,type,keyNode).then(function(response) {
                var medias = prepareDataForViewer(response);
                if(mediaType)
                    vm.MetaMediaViewer[mediaType] = vm.MetaMediaViewer[mediaType].concat(medias.medias);
                else
                    vm.MetaMediaViewer.medias = vm.MetaMediaViewer.medias.concat(medias.medias);
                vm.MetaMediaViewer.tot=medias.tot;
                itemToLoad+=vm.MetaMediaViewer.itemInPage;
                loading=false;
                $scope.$broadcast("viewer:loaded:nextPage");
            }, function(error) {
                var feedback = {
                    title: "Attenzione",
                    msg: "C'è stato un problema durante il caricamento dell'oggetto",
                    close: true,
                    closeText: 'Chiudi'
                };
                $uiMrFeedback.open(feedback);
                $log.error(error);
                loading=false;
                $scope.$broadcast("viewer:loaded:nextPage");
            });
        };
        var metaMediaViewerNextPage = $scope.$on("metaMediaViewer:nextPage",function(e,keyNode,mediaType){
            getNextPage(keyNode,mediaType);
        });
        var viewerWidth = $window.innerWidth;
        var checkEndResize = $rootScope.$on("checkEndResize",function(){
            var contentW = $window.innerWidth-20;
            var contentH = METAFAD_VIEWER_CONFIG.viewerHeight-58;
            var itemInPage = detectItemInPage(contentW,contentH,170,216);
            MainService.setItemInPage(itemInPage);
            if($window.innerWidth>viewerWidth){
                getNextPage();
                viewerWidth=$window.innerWidth;
            }
        });
        
        render();

        $scope.$on("destroy",function(){
            resizeDoResize();
            checkEndResize();
            metaMediaViewerGetMetadato();
            metaMediaViewerNextPage();
        });
    }
})();
