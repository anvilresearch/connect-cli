/**
 * Dependencies
 */

var pkg       = require('./package.json')
  , nash      = require('nash')
  , commands  = require('./lib/commands')
  , cli       = nash()
  ;


/**
 * Settings
 */

cli.set({
  pkg:
    pkg,
  website:
    'http://anvil.io',
  description:
    'A modern authorization server built to\n' +
    'authenticate your users and protect your APIs.',
});


/**
 * Register Commands
 */

cli.register(commands, function (err) {});


/**
 * Exports
 */

module.exports = cli;
