/**
 * Module dependencies
 */

var fs     = require('fs')
  , path   = require('path')
  , log    = require('../log')
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
      log.header(logo);
      log.link(cli.get('website'));
      log.br();
      log.header(cli.get('description'));
      log.br();
      done();
    });

  done();
};


/**
 * Exports
 */

module.exports = registerDefault;
