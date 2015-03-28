/**
 * Dependencies
 */

var pkg       = require('./package.json')
  , fs        = require('fs')
  , path      = require('path')
  , nash      = require('nash')
  , commands  = require('./lib/commands')
  , plugins   = require('./lib/plugins')
  , cli       = nash()
  ;


/**
 * Settings
 */

cli.set({
  pkg:
    pkg,
  logo:
    fs.readFileSync(
      path.join(__dirname, 'lib', 'logo.txt'), 'ascii'
    ),
  website:
    'http://anvil.io',
  description:
    'A modern authorization server built to\n' +
    'authenticate your users and protect your APIs.',
});


/**
 * Register Commands and Plugins
 */

cli.register(commands, function (err) {});
cli.register(plugins, function (err) {});


/**
 * Exports
 */

module.exports = cli;
