(function () {
  'use strict';

  angular
    .module('metaViewerFe')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
