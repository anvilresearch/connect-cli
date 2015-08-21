/**
 * Dependencies
 */

var pkg = require('./package.json')
var fs = require('fs')
var path = require('path')
var nash = require('nash')
var cli = nash()

/**
 * Settings
 */

cli.set({
  pkg: pkg,
  logo: fs.readFileSync(
    path.join(__dirname, 'lib', 'logo.txt'), 'ascii'
  ),
  website: 'http://anvil.io',
  description: 'A modern authorization server built to\n' +
    'authenticate your users and protect your APIs.'
})

/**
 * Initialize
 * Requires and registers a directory of plugins.
 */

cli.initialize = function (directory) {
  var plugins = []
  var modules = fs.readdirSync(directory)

  modules.forEach(function (mod) {
    if (path.extname(mod) === '.js' && path.basename(mod) !== 'index.js') {
      plugins.push({
        register: require(path.join(directory, mod))
      })
    }
  })

  cli.register(plugins, function (err) {
    if (err) { }
  })
}

/**
 * Register Commands and Plugins
 */

cli.initialize(path.join(__dirname, 'lib', 'commands'))
cli.initialize(path.join(__dirname, 'lib', 'plugins'))

/**
 * Exports
 */

module.exports = cli
