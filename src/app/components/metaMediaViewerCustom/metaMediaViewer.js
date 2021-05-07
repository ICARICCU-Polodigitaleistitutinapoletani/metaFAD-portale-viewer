/* global OpenSeadragon, _, METAFAD_VIEWER_CONFIG */
(function () {
    'use strict';

    angular
        .module('metaMediaViewerModule', [])
        .directive('metaMediaViewerDirective', metaMediaViewer)
        .directive('lazyImg', function () {

            // var count = 0;

            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    return attrs.$observe("afklLazyImageLoaded", function (value) {
                        console.log(value);
                        scope.$emit('lazyImg:loaded', value);
                    });
                }
            };

        })
        .directive('paginationComponent', function () {
            return {
                restrict: 'E',
                templateUrl: 'app/components/metaMediaViewerCustom/pagination.html',
                replace: true
            };

        })
        .service('LoadingService', [function () {
            var self = this;
            this.loader = null;
            this.open = function (content, message, template) {
                var contenitore;
                var boxMessage = message ? '<div class="custom-message">' + message + '</div>' : '';
                var templates = {
                    "default": '<div id="loadingService-custom-loader" class="custom-loader">'
                        + boxMessage
                        + '<div class="custom-spinner">'
                        + '<div class="bounce1"></div>'
                        + '<div class="bounce2"></div>'
                        + '<div class="bounce3"></div>'
                        + '</div>'
                        + '</div>',
                    "pace": '<div id="loadingService-custom-loader" class="custom-loader-pace">'
                        + '<div class="custom-pace"></div>'
                        + boxMessage
                        + '</div>'
                }
                var loader = templates[template] || templates["default"];
                if (!content) {
                    var checkBodyLoader = angular.element("#loadingService-block-layer-loading");
                    if (checkBodyLoader.length)
                        return false;
                    var classTem = template || "";
                    loader = '<div id="loadingService-block-layer-loading" class="block-layer-loading ' + classTem + '">' + loader + '</div>';
                    self.loader = "#loadingService-block-layer-loading";
                    contenitore = angular.element("body");
                }
                else {
                    contenitore = content;
                    self.loader = "#loadingService-custom-loader";
                }
                contenitore.append(loader);
            };
            this.close = function () {
                if (self.loader)
                    angular.element(self.loader).remove();
            };
        }])

    /** @ngInject */
    function metaMediaViewer() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/metaMediaViewerCustom/metaMediaViewer.html',
            scope: {
                medias: "=",
                mediasGrid: "=",
                index: "=",
                tot: "=",
                totFolder: "=",
                itemInPage: "=",
                options: "=",
                info: "=",
                firstPageOdd: "=",
                titleMetadato: "="
            },
            controller: metaMediaViewerController,
            controllerAs: 'metaMediaViewer',
            bindToController: true,
            replace: true
        };
        return directive;
    }

    /** @ngInject */
    function metaMediaViewerController($rootScope, $scope, $log, $sce, $element, $filter, $timeout, refreshAngularCircle, DamCollectionManagerService, viewerFactory, MainService, mergeArrayUnique, serviceUUID, LoadingService, $uiMrFeedback) {
        // inizializzo una variabile che referenzia il modulo
        var vm = this;
        var allMedia;
        vm.singleMetadato = false;
        vm.showBtnEcommerce = METAFAD_VIEWER_CONFIG.popupEcommerce;
        vm.showEcommerce = false;
        vm.iframeEcommerceUrl;
        vm.loadingMedia = false;
        vm.bodyStyle = METAFAD_VIEWER_CONFIG.containerBg ? "background:" + METAFAD_VIEWER_CONFIG.containerBg : "";
        vm.btnOptions = METAFAD_VIEWER_CONFIG.buttonHeader;
        vm.mediaViewerOptions = {
            modal: false,
            height: '100%',
            hideHeader: true
        };
        vm.pagination = METAFAD_VIEWER_CONFIG.pagination;
        vm.manageEcommerce = function () {
            if (vm.view !== 'single-page' && vm.view !== 'single-zoom')
                return;
            vm.showEcommerce = !vm.showEcommerce;
            vm.iframeEcommerceUrl = $sce.trustAsResourceUrl(METAFAD_VIEWER_CONFIG.popupEcommerce + "?id=" + MainService.metadato + "&type=" + MainService.typeMetadato + "&mediaId=" + vm.media.id);
        };
        //Abilitare la riga sotto per abilitare zoom tramite proprietà css zoom per i browser che la supportano (Chrome). 
        //Usare la proprietà zoom disabilità però l'animazione quando si fa zoom
        //vm.zoomSupported = "zoom" in document.body.style;
        vm.languages = {
            icon_index: "Indice",
            icon_info: "Info",
            icon_text: "Testo",
            icon_text_search: "Cerca nel testo",
            icon_download: "Scarica",
            icon_ecommerce: "Acquista",
            icon_view_grid: "Vista griglia",
            icon_view_single: "Vista singola pagina",
            icon_view_zoom: "Vista con extra zoom",
            icon_view_double: "Vista a doppia pagina",
            icon_view_rullo: "Vista scorrevole",
            icon_social: "Condividi",
            icon_zoom_out: "Rimpiccolisci",
            icon_zoom_normal: "Ripristina",
            icon_zoom_in: "Ingrandisci",
            icon_rotate_left: "Ruota a sinistra",
            icon_rotate_right: "Ruota a destra",
            icon_full_page: "Schermo intero"
        };
        var render = function () {
            //$element.find(".body img").on("load",$scope.setInitZoom);
            $timeout(function () {
                DamCollectionManagerService.initTree("viewerIndex", vm.treeConfig, vm.index, true, null);
                $scope.$emit("metaMediaViewer:scroll");
            }, 1000);
            allMedia = _.clone(vm.medias);
            vm.setMedia(1);
            if (allMedia.length === 1)
                vm.singleMetadato = true;
            if (vm.options && vm.options.languages) {
                vm.languages = Object.assign(vm.languages, vm.options.languages);
            }
        };

        $scope.$watch('metaMediaViewer.medias', function (newVal) {
            if (allMedia.length < newVal.length)
                allMedia = _.clone(newVal);
            else {
                allMedia.splice(0, newVal.length);
                allMedia = newVal.concat(allMedia);
            }
        });

        vm.modalMode = vm.options.modal;
        vm.btnClose = vm.options.modal && vm.options.btnClose;
        vm.contentHeight = !vm.modalMode && vm.options.height;
        vm.contentHeightNoToolbar = parseInt(vm.contentHeight) - 38 + "px";
        $scope.$watch('metaMediaViewer.options.height', function (newVal) {
            vm.contentHeight = !vm.modalMode ? newVal : "";
            vm.bodyHeight = angular.element($element.find(".body")).height();
        });
        var detectScrollEndBottom = $rootScope.$on('detectScrollEnd:bottom', function () {
            if (vm.showLoading)
                return;
            if (vm.folderActive && vm.mediasGrid.length >= vm.totFolder)
                return;
            if (vm.mediasGrid.length >= vm.tot)
                return;
            vm.showLoading = true;
            var keyNode = vm.folderActive && vm.folderActive.key;
            $scope.$emit("metaMediaViewer:nextPage", keyNode, "mediasGrid");
        });
        vm.showLoading = false;
        var viewerLoadedNextPage = $scope.$on("viewer:loaded:nextPage", function (e) {
            vm.showLoading = false;
        });
        vm.close = function () {
            $element.remove();
            var params = vm.options.fnClosePrm;
            vm.options.fnClose.apply(this, params);
        };
        vm.view = "single-page";
        vm.setView = function (view) {
            vm.view = view;
            if (view === "double-page") {
                setDoublePage();
            }
            vm.setInfoMedia();
        };
        vm.doubleMedia = [];
        var setDoublePage = function () {
            vm.doubleMedia = [];
            var objPosMedia = {
                "1": 0,
                "2": 1
            };
            var posMedia = vm.media.side ? objPosMedia[vm.media.side] : false;
            var indexMedia = _.findIndex(allMedia, { id: vm.media.id });
            var otherMediaIndex;
            var currentMediaPos;
            if (vm.firstPageOdd) {
                if (indexMedia === 0) {
                    currentMediaPos = 'right';
                    otherMediaIndex = -1;
                } else {
                    // pari a DX e dispari a SX
                    if ((indexMedia % 2) === 0) { // Pari
                        currentMediaPos = 'right';
                        otherMediaIndex = indexMedia - 1;
                    } else {
                        currentMediaPos = 'left';
                        otherMediaIndex = indexMedia + 1;
                    }
                }
            } else {
                if ((!posMedia || posMedia === 0) && (indexMedia % 2) === 0) {
                    currentMediaPos = 'left';
                    otherMediaIndex = indexMedia + 1;
                } else {
                    currentMediaPos = 'right';
                    otherMediaIndex = indexMedia - 1;
                }
            }
            if (otherMediaIndex >= 0 && !allMedia[otherMediaIndex]) {
                getMedia(otherMediaIndex, "setDoublePage");
                return;
            }
            if (currentMediaPos === 'left') {
                vm.doubleMedia[0] = vm.media; // SX
                vm.doubleMedia[1] = otherMediaIndex >= 0 ? allMedia[otherMediaIndex] : undefined; // DX
            } else {
                vm.doubleMedia[0] = otherMediaIndex >= 0 ? allMedia[otherMediaIndex] : undefined; // SX
                vm.doubleMedia[1] = vm.media; // DX
            }
            vm.bodyHeight = angular.element($element.find(".body")).height() - 5; // .box-double .img-container { top:10px; bottom:10px; }
        };
        vm.loadSingleMedia = function (index) {
            vm.view = "single-page";
            vm.setMedia(index + 1);
        };
        vm.currentMedia = 1;
        vm.totalMedias = vm.medias.length;
        vm.media = null;
        vm.prev = false;
        vm.next = false;
        vm.viewer;
        var getMedia = function (pos, from) {
            var type = MainService.typeMetadato;
            var id;
            var idQuery;
            if (METAFAD_VIEWER_CONFIG.idType === 'query') {
                id = '';
                idQuery = MainService.metadato;
            } else {
                id = MainService.metadato;
                idQuery = null;
            }
            viewerFactory.getMetadato(id, idQuery, pos, 1, type).then(function (response) {
                try {
                    if (!response.physicalSTRU.image[0].id)
                        response.physicalSTRU.image[0].id = serviceUUID.create();
                    allMedia[pos] = response.physicalSTRU.image[0];
                    if (from === "setMedia")
                        vm.setMedia(pos + 1, null);
                    else if (from === "setDoublePage")
                        setDoublePage();
                }
                catch (err) { }
            }, function (error) {
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
        var objPhotoDim;
        var setNavigatorDim = function (obj) {
            var container = angular.element(".navigator");
            var side = objPhotoDim.width > objPhotoDim.height ? "width" : "height";
            var sideMin = side === "width" ? "height" : "width";
            var sideContainer = container[side]();
            var sideContainerMin = parseInt((objPhotoDim[sideMin] * sideContainer) / objPhotoDim[side]);
            container.css(sideMin, sideContainerMin + 'px');
        }
        vm.setInfoMedia = function () {
            vm.infoMedia = vm.info || '';
            // Se pagina singola, e info specifiche per media, visualizzo quelle
            // altrimenti visualizzo info generiche
            if (vm.view === 'single-page' || vm.view === 'single-zoom') {
                vm.infoMedia = vm.media && vm.media.info ? vm.media.info : vm.infoMedia;
            }
            if (vm.view === 'double-page') {
                vm.infoMedia += vm.doubleMedia[0] ? '<p>' + vm.doubleMedia[0].title + '</p>' : '';
                vm.infoMedia += vm.doubleMedia[1] ? '<p>' + vm.doubleMedia[1].title + '</p>' : '';
            } else {
                vm.media = allMedia[vm.currentMedia - 1];
                if (vm.media)
                    vm.infoMedia = vm.infoMedia ? vm.infoMedia + '<p>' + vm.media.title + '</p>' : '<p>' + vm.media.title + '</p>' || '';
            }
        };
        vm.setMedia = function (val, dir) {
            if (vm.loadingMedia)
                return;
            vm.showEcommerce = false;
            LoadingService.open();
            vm.loadingMedia = true;
            vm.currentMedia = val ? val : dir ? vm.currentMedia + dir : 1;
            vm.media = allMedia[vm.currentMedia - 1];
            vm.setInfoMedia();
            if (!vm.media) {
                getMedia(vm.currentMedia - 1, "setMedia");
                return;
            }
            if (vm.media.tile) {
                if (vm.viewer) {
                    angular.element("#openseadragon1").html("");
                }
                vm.viewer = OpenSeadragon({
                    id: "openseadragon1",
                    showNavigator: angular.isDefined(METAFAD_VIEWER_CONFIG.navigatorBlock) ? METAFAD_VIEWER_CONFIG.navigatorBlock : true,
                    visibilityRatio: 1,
                    maxZoomPixelRatio: 4,
                    constrainDuringPan: true,
                    zoomInButton: "osd-zoom-in",
                    zoomOutButton: "osd-zoom-out",
                    homeButton: "osd-home",
                    fullPageButton: "osd-full-page",
                    rotateLeftButton: "osd-rotate-left",
                    rotateRightButton: "osd-rotate-right",
                    prefixUrl: "../bower_components/openseadragon/built-openseadragon/openseadragon/images/"
                });
                OpenSeadragon.makeAjaxRequest(vm.media.tile, function (xhr) {
                    vm.viewer.open(xhr.response);
                });
                if (METAFAD_VIEWER_CONFIG.navigatorBlock) {
                    vm.viewer.addHandler('open', function (event) {
                        var width;
                        var height;
                        try {
                            width = event.eventSource.source.Image.Size.Width;
                            height = event.eventSource.source.Image.Size.Height;
                        }
                        catch (err) {
                            width = event.source.substring(event.source.lastIndexOf("Width=\"") + 7, event.source.lastIndexOf("\" Height=\""));
                            height = event.source.substring(event.source.lastIndexOf("Height=\"") + 8, event.source.lastIndexOf("\"/>"));
                        }
                        objPhotoDim = {
                            width: width || event.source.substring(event.source.lastIndexOf("Width=\"") + 7, event.source.lastIndexOf("\" Height=\"")),
                            height: height || event.source.substring(event.source.lastIndexOf("Height=\"") + 8, event.source.lastIndexOf("\"/>"))
                        };
                        $timeout(function () {
                            setNavigatorDim();
                        }, 500);
                    });
                    vm.viewer.addHandler('resize', function (event) {
                        $timeout(function () {
                            setNavigatorDim();
                        }, 500);
                    });
                    angular.element(".mibac_museowebfad_viewer .displayregion").attrchange({
                        trackValues: true, // set to true so that the event object is updated with old & new values
                        callback: function (evnt) {
                            if (evnt.attributeName == "style") {
                                var w = angular.element(".navigator canvas").width() - parseInt(evnt.target.style.width);
                                var left = parseInt(evnt.target.style.left);
                                if (left < 0 || left > w) {
                                    vm.viewer.viewport.applyConstraints()
                                }
                                var h = angular.element(".navigator canvas").height() - parseInt(evnt.target.style.height);
                                var top = parseInt(evnt.target.style.top);
                                if (top < 0 || top > h) {
                                    vm.viewer.viewport.applyConstraints()
                                }
                            }
                        }
                    });
                }
            }
            vm.prev = vm.currentMedia > 1 ? true : false;
            vm.next = vm.currentMedia < vm.tot ? true : false;
            vm.bodyHeight = angular.element($element.find(".body")).height();
            setDoublePage();
            if (vm.media.type === 'IMAGE') {
                var img = new Image();
                img.addEventListener('load', function () {
                    LoadingService.close();
                    $scope.setInitZoom();
                    vm.loadingMedia = false;
                    vm.setInfoMedia();
                    refreshAngularCircle($scope);
                }, false);
                img.src = vm.media.url;
            } else {
                LoadingService.close();
                vm.loadingMedia = false;
            }
            // codice per abilitare il pinchToZoom anche su zoom base (single-page)
            // if(vm.view==="single-page"){
            //     $element.find('.body .box-img-notile img').panzoom();
            // }
        };
        vm.setZoom = null;
        $scope.setInitZoom = function () {
            vm.setZoom = $scope.getInitZoom();
            if (vm.zoomSupported) {
                $element.find('.body .box-img-notile img').css("transform", "none");
                $element.find('.body .box-img-notile img').css("zoom", vm.setZoom);
            }
            else {
                var imgW = $element.find('.body .box-img-notile img').width();
                $element.find('.body .box-img-notile img').css("position", "absolute");
                $element.find('.body .box-img-notile img').css("margin-left", "-" + imgW / 2 + "px");
                $element.find('.body .box-img-notile img').css("transform", "scale(" + vm.setZoom + ")");
                $element.find('.body .box-img-notile img').css("transform-origin", "50% top");
            }
            $element.find(".body .box-img-notile img").off("load");
            $element.find('.body .box-img-notile img').css("top", 0);
            $element.find('.body .box-img-notile img').css("left", "");
            zoomEnabled = true;
            $scope.$broadcast("setDraggable:enable", zoomEnabled);
        };
        $scope.getInitZoom = function () {
            var zoomWidth = null;
            var zoomHeight = null;
            var widthBody = $element.find('.body').width();
            var heightBody = $element.find('.body').height();
            var widthImg = $element.find('.body .box-img-notile img').width();
            var heightImg = $element.find('.body .box-img-notile img').height();
            var zoom;
            if (widthImg > widthBody) {
                zoomWidth = widthBody / widthImg;
            }
            if (heightImg > heightBody) {
                zoomHeight = heightBody / heightImg;
            }
            if (zoomWidth && zoomHeight) {
                zoom = zoomWidth <= zoomHeight ? zoomWidth : zoomHeight;
            }
            else {
                zoom = zoomWidth || zoomHeight || 1;
            }
            return zoom;
        };
        vm.checkZoom = function (type) {
            vm.showEcommerce = false;
            if (vm.view === "single-page") {
                if (type === "in")
                    vm.zoomIn();
                else if (type === "out")
                    vm.zoomOut();
                else
                    $scope.setInitZoom();
            }
        };

        var zoomEnabled;
        var zoomActive = false;
        vm.zoomIn = function () {
            if (zoomActive)
                return false;
            zoomActive = true;
            vm.setZoom += 0.1;
            if (vm.zoomSupported)
                $element.find('.body .box-img-notile img').css("zoom", vm.setZoom);
            else {
                var imgW = $element.find('.body .box-img-notile img').width();
                $element.find('.body .box-img-notile img').css("margin-left", "-" + imgW / 2 + "px");
                $element.find('.body .box-img-notile img').css("transform", "scale(" + vm.setZoom + ")");
                $element.find('.body .box-img-notile img').css("transform-origin", "50% top");
            }
            if (!zoomEnabled && vm.setZoom > $scope.getInitZoom()) {
                zoomEnabled = true;
                //$scope.$broadcast("setDraggable:enable",zoomEnabled);
            }
            angular.element('.metaMediaViewer.modal-preview .body .content-view').height('99%');
            $timeout(function () {
                angular.element('.metaMediaViewer.modal-preview .body .content-view').height('100%');
                zoomActive = false;
            }, 300);
        };
        vm.zoomOut = function () {
            if (zoomActive || (vm.setZoom - 0.1) < 0)
                return false;
            zoomActive = true;
            vm.setZoom -= 0.1;
            if (vm.zoomSupported)
                $element.find('.body .box-img-notile img').css("zoom", vm.setZoom);
            else {
                var imgW = $element.find('.body .box-img-notile img').width();
                $element.find('.body .box-img-notile img').css("margin-left", "-" + imgW / 2 + "px");
                $element.find('.body .box-img-notile img').css("transform", "scale(" + vm.setZoom + ")");
                $element.find('.body .box-img-notile img').css("transform-origin", "50% top");
            }
            if (zoomEnabled && vm.setZoom < $scope.getInitZoom()) {
                zoomEnabled = false;
                //$scope.$broadcast("setDraggable:enable",zoomEnabled);
            }
            $timeout(function () {
                zoomActive = false;
            }, 300);
        };

        vm.checkRotate = function (type) {
            if (vm.view !== "single-page" && vm.view !== "single-zoom")
                return;
            vm.showEcommerce = false;
            vm.rotate[type]();
        };

        vm.rotate = {
            "status": 0,
            "setRotate": function (deg) {
                var img = angular.element(".box-img-notile img");
                var transImg = angular.element(".box-img-notile img")[0].style.transform;
                transImg = transImg.replace("none", "");
                if (transImg.indexOf("rotate") !== -1) {
                    transImg = transImg.replace(/rotate((.*?)deg)/, "rotate(" + deg + "deg")
                }
                else {
                    transImg += " rotate(" + deg + "deg)";
                }
                angular.element(".box-img-notile img")[0].style.transform = transImg;
            },
            "right": function () {
                var deg = vm.rotate.status === 270 ? 0 : vm.rotate.status + 90;
                vm.rotate.status = deg;
                if (vm.view === "single-zoom")
                    return vm.viewer.viewport.setRotation(deg);
                vm.rotate.setRotate(deg);
            },
            "left": function () {
                var deg = vm.rotate.status === 0 ? 270 : vm.rotate.status - 90;
                vm.rotate.status = deg;
                if (vm.view === "single-zoom")
                    return vm.viewer.viewport.setRotation(deg);
                vm.rotate.setRotate(deg);
            },
            "init": function () {
                var deg = 0;
                vm.rotate.status = deg;
                if (vm.view === "single-zoom")
                    return vm.viewer.viewport.setRotation(deg);
                vm.rotate.setRotate(deg);
            }
        };
        vm.panelActive = false;
        vm.toggleEle = function (ele) {
            vm.showEcommerce = false;
            if (ele)
                return false;
            else {
                return true;
            }
        };
        vm.checkSupportedMedia = function (tipo) {
            var supportMedia = ["IMAGE", "VIDEO", "AUDIO", "PDF"];
            var support = supportMedia.indexOf(tipo) !== -1 ? true : false;
            return support;
        };
        vm.enableIndex = function () {
            var arView = ["single-page", "single-zoom", "double-page"];
            var check = arView.indexOf(vm.view) !== -1;
            return check;
        }
        vm.pages = {
            showBox: false,
            viewBox: function () {
                if (vm.pages.showBox)
                    return vm.pages.showBox = false;
                vm.pages.showBox = true;
            },
            range: [],
            goToFirst: function () {
                if (!vm.prev)
                    return;
                vm.setMedia(1);
            },
            goToLast: function () {
                if (!vm.next)
                    return;
                vm.setMedia(vm.tot);
            },
            goPrevious: function () {
                if (!vm.prev)
                    return;
                var num = 1;
                if (vm.view === "double-page")
                    num++
                vm.setMedia(false, -num);
            },
            goNext: function () {
                if (!vm.next)
                    return;
                var num = 1;
                if (vm.view === "double-page")
                    num++
                vm.setMedia(false, num);
            },
            goTo: function (val) {
                vm.setMedia(val);
                vm.pages.showBox = false;
            }
        };
        vm.treeConfig = {
            extensions: ["glyph"],
            init: function (event, data) {
                var keyExclude = data.tree.getNodeByKey("exclude");
                if (keyExclude)
                    keyExclude.remove();
            },
            activate: function (event, data) {
                vm.loadEleFolder(data.node);
            },
            glyph: {
                map: {
                    doc: "icon-vw-folder",
                    docOpen: "fa fa-folder-open-o",
                    checkbox: "fa fa-unchecked",
                    checkboxSelected: "fa fa-check",
                    checkboxUnknown: "fa fa-share",
                    dropMarker: "fa fa-arrow-right",
                    expanderClosed: "fa fa-caret-right",
                    expanderOpen: "fa fa-caret-down",
                    folder: "icon-vw-folder",
                    folderOpen: "fa fa-folder-open-o"
                }
            }
        };
        vm.folderActive = null;
        vm.loadEleFolder = function (node) {
            // var countLazyImg = 0;
            // vm.lazyLoaded = false;
            // if(vm.view!=="grid" && vm.view!=="rullo")
            //     vm.view="grid";
            // if(node==="all"){
            //     vm.folderActive = null;
            //     DamCollectionManagerService.refreshActiveNode("viewerIndex",true);
            //     $scope.$emit("metaMediaViewer:getMetadato",0,null);
            //     return;
            // }
            // else{
            //     $scope.$emit("metaMediaViewer:getMetadato",0,null,node.key);
            // }
            var mediaIndex = _.findIndex(vm.medias, function (ele, key) {
                return ele.keyNode == node.key || ele.aliasKeyNode == node.key || (ele.aliasKeyNode && ele.aliasKeyNode.indexOf(node.key) !== -1);
            });
            vm.pages.goTo(mediaIndex + 1);
            vm.folderActive = node;
            refreshAngularCircle($scope);
        };
        vm.lazyOptions = {
            offset: 0
        };
        var countLazyImg = 0;
        vm.lazyLoaded = false;
        var lazyImgLoaded = $scope.$on("lazyImg:loaded", function (event, value) {
            countLazyImg++;
            if (countLazyImg === vm.medias.length) {
                vm.lazyLoaded = true;
            }
        });
        vm.range = $filter("range")(vm.pages.range, vm.tot);
        var resizeDoResize = angular.element(window).on("resize.doResize", function () {
            $scope.setInitZoom();
        });
        render();
        $scope.$on("destroy", function () {
            lazyImgLoaded();
            detectScrollEndBottom();
            viewerLoadedNextPage();
            resizeDoResize();
        });
    }
})();
