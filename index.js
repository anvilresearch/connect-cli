/**
 * Dependencies
 */

var pkg  = require('./package.json')
  , fs   = require('fs')
  , path = require('path')
  , nash = require('nash')
  , cli  = nash()
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
 * Initialize
 * Requires and registers a directory of plugins.
 */

cli.initialize = function (directory) {
  var plugins = []
    , modules = fs.readdirSync(directory)
    ;

  modules.forEach(function (mod) {
    if (path.extname(mod) === '.js' && path.basename(mod) !== 'index.js') {
      plugins.push({
        register: require(path.join(__dirname, directory, mod))
      });
    }
  });

  cli.register(plugins, function (err) {});
}


/**
 * Register Commands and Plugins
 */

cli.initialize('./lib/commands');
cli.initialize('./lib/plugins');


/**
 * Exports
 */

module.exports = cli;
