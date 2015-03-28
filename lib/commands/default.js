/**
 * Module dependencies
 */

var fs     = require('fs')
  , path   = require('path')
  , format = require('../format')
  ;


/**
 * Load logo
 */

var logo = fs.readFileSync(path.join(__dirname, '..', 'logo.txt'), 'ascii');


/**
 * Default
 */

function registerDefault (cli, options, done) {
  cli.default()
    .handler(function (data, flags, done) {
      console.log(format.header(logo));
      done();
    });

  done();
};


/**
 * Exports
 */

module.exports = registerDefault;
