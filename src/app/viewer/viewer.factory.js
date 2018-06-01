/* global _ */
(function() {
    'use strict';

    angular
        .module('metaViewerFe')
        .factory('viewerFactory', viewerFactory);

    /** @ngInject */
    function viewerFactory($q, $log, MainService) {
        return {
            getMetadatoMock: function(id,init,num,type) {
                var deferred = $q.defer();
                MainService.serviceProvider.get({'resource1':'metadato', 'element1':id, 'init':init, 'num':num, 'type':type}, {}, function(response) {
                    var setUuid = true;
                    response.physicalSTRU.tot = response.physicalSTRU.image.length;
                    if(setUuid){
                        _.forEach(response.physicalSTRU.image,function(value,key){
                            value.id=key+1000;
                        });
                        setUuid=false;
                    }
                    var end = (init+num)<response.physicalSTRU.image.length ? num : response.physicalSTRU.image.length - init;
                    response.physicalSTRU.image = response.physicalSTRU.image.splice(init,end);
                    deferred.resolve(response);
                }, function(error) {
                    var errMsg = (error.data && error.data.message) ? error.data.message : "Server non raggiungibile";
                    $log.error(errMsg);
                    deferred.reject(errMsg);
                });
                //deferred.resolve(data);
                return deferred.promise;
            },
            getMediaMock: function(id,pos) {
                var deferred = $q.defer();
                //MainService.serviceProvider.get({'resource1':'strumag', 'element1':id, 'resource2': 'page', 'element2':pos}, {}, function(response) {
                MainService.serviceProvider.get({'resource1':'strumag', 'element1':id}, {}, function(response) {
                    var media = response.physicalSTRU.image[pos];
                    var obj = {
                        "id":media.id,
                        "thumbnail":media.thumbnail,
                        "title":media.title,
                        "type":media.type,
                        "url":media.src,
                        "tile":media.tile,
                        "keyNode":media.keyNode,
                        "aliasKeyNode": value.aliasKeyNode,
                        "label":media.label
                    };
                    deferred.resolve(obj);
                }, function(error) {
                    var errMsg = (error.data && error.data.message) ? error.data.message : "Server non raggiungibile";
                    $log.error(errMsg);
                    deferred.reject(errMsg);
                });
                //deferred.resolve(data);
                return deferred.promise;
            },
            getMetadato: function(id,idQuery,init,num,type,keyNode) {
                var deferred = $q.defer();
                if (idQuery)
                    idQuery = encodeURI(idQuery);
                MainService.serviceProvider.get({ 'resource1': 'metadato', 'element1': id, id: idQuery, 'init':init, 'num':num, 'type':type, 'folder':keyNode}, {}, function(response) {
                    // response.physicalSTRU.image = [response.physicalSTRU.image[0]];
                    // response.physicalSTRU.tot=1;
                    if(!response.physicalSTRU.tot)
                        response.physicalSTRU.tot = response.physicalSTRU.image.length;
                    deferred.resolve(response);
                }, function(error) {
                    var errMsg = (error.data && error.data.message) ? error.data.message : "Server non raggiungibile";
                    $log.error(errMsg);
                    deferred.reject(errMsg);
                });
                //deferred.resolve(data);
                return deferred.promise;
            },
            getMedia: function(id,pos) {
                var deferred = $q.defer();
                //MainService.serviceProvider.get({'resource1':'strumag', 'element1':id, 'resource2': 'page', 'element2':pos}, {}, function(response) {
                MainService.serviceProvider.get({'resource1':'strumag', 'element1':id}, {}, function(response) {
                    var media = response.physicalSTRU.image[pos];
                    deferred.resolve(media);
                }, function(error) {
                    var errMsg = (error.data && error.data.message) ? error.data.message : "Server non raggiungibile";
                    $log.error(errMsg);
                    deferred.reject(errMsg);
                });
                //deferred.resolve(data);
                return deferred.promise;
            }
        }
    }
})();
