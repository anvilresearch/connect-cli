/**
 * Dependencies
 */

var nash      = require('nash')
  , commands  = require('./lib/commands')
  , cli       = nash()
  ;


/**
 * Register Commands
 */

cli.register(commands, function (err) {});


/**
 * Exports
 */

module.exports = cli;
