/**
 * Module.dependencies
 */

var format = require('./format');


/**
 * Log
 */

function log (data) {
  console.log(data);
}


/**
 * Formatted log methods
 */

Object.keys(format).forEach(function (key) {
  log[key] = function (data) {
    console.log(format[key](data));
  };
});


/**
 * Break
 */

log.br = function () {
  console.log();
}

/**
 * Exports
 */

module.exports = log;
