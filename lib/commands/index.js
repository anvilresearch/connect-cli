/**
 * Module dependencies
 */

var fs   = require('fs')
  , path = require('path')
  ;


/**
 * Find modules to load
 */

var modules = fs.readdirSync(__dirname);


/**
 * Exports
 */

module.exports = [];


/**
 * Load modules
 */

modules.forEach(function (mod) {
  if (path.extname(mod) === '.js' && mod !== 'index.js') {
    module.exports.push({
      register: require(path.join(__dirname, mod))
    });
  }
});
