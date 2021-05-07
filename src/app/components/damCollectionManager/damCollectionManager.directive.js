/* global _ */
(function () {
    'use strict';

    angular
        .module('damCollectionManagerMdl')
        .directive('damCollectionManager', damCollectionManager);

    /** @ngInject */
    function damCollectionManager() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/damCollectionManager/damCollectionManager.html',
            scope: {
                instance: "@datainstance",
                treeConfig: "=treeConfig"
            },
            controller: damCollectionManagerController,
            controllerAs: 'damColMng',
            bindToController: true
        };
        return directive;
    }

    /** @ngInject */
    function damCollectionManagerController($scope, $rootScope, $element, $timeout, $log, DamCollectionManagerService) {
        // inizializzo una variabile che referenzia il modulo
        var vm = this;
        var render = function () {
        };
        var treeEle = null;
        var createTree = function (instance, tree) {
            var newElement = angular.element('<div class="fancyTreeInstance"></div>');
            tree.instance = instance;
            treeEle = newElement.fancytree(tree);
            $element.html(newElement);
        };
        var initTree = $rootScope.$on("damCollectionManagerInitTree", function (event, instance, treeConfig, treeSource, obj) {
            if (instance === vm.instance) {
                vm.treeConfig = treeConfig;
                if (obj) {
                    arrangeToFancyTree[obj](treeSource, function (tree) {
                        vm.treeConfig.source = tree;
                    });
                }
                else {
                    vm.treeConfig.source = treeSource;
                }
                createTree(instance, vm.treeConfig);
                var expanded = DamCollectionManagerService.getExpandNode(vm.instance);
                _.forEach(expanded, function (value) {
                    if (obj === "path")
                        expandByPath(value);
                });
            }
        });
        var setTreeConfigPart = $rootScope.$on("damCollectionManagerSetTreeConfigPart", function (event, instance, configValue) {
            if (instance === vm.instance) {
                var eleTree = $element.find(".fancyTreeInstance")[0];
                _.forEach(configValue, function (value) {
                    vm.treeConfig[value.key] = value.value;
                    angular.element(eleTree).fancytree('option', value.key, value.value);
                });
            }
        });
        var arrangeToFancyTree = {
            path: fromPathToFancyTree,
            objLazy: fromObjToFancyTreeLazy
        };
        function fromObjToFancyTreeLazy(objs, cb) {
            var tree = [];
            var key = 1;
            _.forEach(objs, function (obj) {
                var node = {
                    id: obj.id,
                    title: obj.title,
                    key: obj.id || key,
                    folder: true,
                    lazy: obj.hasChild
                };
                tree.push(node);
            });
            cb(tree);
        }
        function fromPathToFancyTree(paths, cb) {
            var tree = [];
            var key = 1;
            _.forEach(paths, function (path) {
                var pathParts = path.label.split('/');
                var currentLevel = tree;
                _.forEach(pathParts, function (part) {
                    var existingPath = _.find(currentLevel, { title: part });
                    if (existingPath) {
                        currentLevel = existingPath.children;
                    }
                    else {
                        if (part && part != "") {
                            var newPart = {
                                title: part,
                                key: key,
                                folder: true,
                                children: []
                            }
                            currentLevel.push(newPart);
                            currentLevel = newPart.children;
                            key++;
                        }
                    }
                });
            });
            cb(tree);
        }
        var setActiveNode = $rootScope.$on("damCollectionManagerSetActiveNode", function (event, instance, node) {
            if (instance === vm.instance) {
                activateNode(node);
            }
        });
        var activateNode = function (node) {
            var eleTree = $element.find(".fancyTreeInstance")[0];
            var root = angular.element(eleTree).fancytree("getRootNode");
            root.tree.activateKey(node.key);
        };
        var refreshActiveNode = $rootScope.$on("damCollectionManagerRefreshActiveNode", function (event, instance) {
            if (instance === vm.instance) {
                var eleTree = $element.find(".fancyTreeInstance")[0];
                var root = angular.element(eleTree).fancytree("getRootNode");
                var node = root.tree.getActiveNode();
                if (node) {
                    node.setFocus(false);
                    node.setActive(false);
                }
            }
        });
        var setExpandNode = $rootScope.$on("damCollectionManagerSetExpandNode", function (event, instance, type) {
            if (instance === vm.instance) {
                var nodes = DamCollectionManagerService.getActiveNode();
                if (type === "path")
                    expandByPath(nodes);
            }
        });
        var addExpandNode = $rootScope.$on("damCollectionManagerAddExpandNode", function (event, instance, value, type) {
            if (instance === vm.instance) {
                if (type === "path")
                    expandByPath(value);
                else if (type === "id")
                    expandById(value);
            }
        });
        var expandByPath = function (path) {
            var eleTree = $element.find(".fancyTreeInstance")[0];
            var root = angular.element(eleTree).fancytree("getRootNode");
            if (!root)
                return;
            path = path.split("/");
            _.forEach(path, function (value) {
                root = root && root.findFirst(value);
                if (root)
                    root.setExpanded(true);
            });
        };
        var expandById = function (id) {
            var eleTree = $element.find(".fancyTreeInstance")[0];
            var root = angular.element(eleTree).fancytree("getRootNode");
            var node = root.tree && root.tree.getNodeByKey(id);
            if (node) {
                if (node.lazy === false)
                    node.lazy = true;
                var expanded = node.isExpanded();
                if (expanded)
                    node.resetLazy();
                $timeout(function () { node.setExpanded(true) }, 300);
            }
        };
        /*var expandByPathLazy = function(path){
            var eleTree = $element.find(".fancyTreeInstance")[0];
            var root = angular.element(eleTree).fancytree("getRootNode");
            if(!root)
                return;
            path = path.split("/");
            _.forEach(path,function(value){
                root = root && root.findFirst(value);
                if(root)
                    root.setExpanded(true);
            });
        };*/
        var addSelectedNode = $rootScope.$on("damCollectionManagerAddSelectedNode", function (event, instance, value, type) {
            if (instance === vm.instance) {
                if (type === "id")
                    selectById(value);
            }
        });
        var selectById = function (id) {
            var eleTree = $element.find(".fancyTreeInstance")[0];
            var root = angular.element(eleTree).fancytree("getRootNode");
            var node = root.tree && root.tree.getNodeByKey(id);
            if (node) {
                node.setSelected(true);
            }
        };
        var removeSelectedNode = $rootScope.$on("damCollectionManagerRemoveSelectedNode", function (event, instance, value, type) {
            if (instance === vm.instance) {
                if (type === "id")
                    deselectById(value);
            }
        });
        var deselectById = function (id) {
            var eleTree = $element.find(".fancyTreeInstance")[0];
            var root = angular.element(eleTree).fancytree("getRootNode");
            var node = root.tree && root.tree.getNodeByKey(id);
            if (node) {
                node.setSelected(false);
            }
        };
        $scope.$emit(vm.instance + "ManagerReady", vm.instance + "Manager");
        $scope.$on("$stateChangeStart", function () {
            initTree();
            setTreeConfigPart();
            setActiveNode();
            setExpandNode();
            addExpandNode();
            addSelectedNode();
            removeSelectedNode();
            refreshActiveNode();
            DamCollectionManagerService.refresh();
        });
        render();
    }
})();
