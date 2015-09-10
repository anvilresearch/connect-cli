/* global __dirname */

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
 * Register modules
 *
 * Requires and registers plugins.
 */

cli.registerModules = function (modules, callback) {
  var plugins = []

  modules.forEach(function (jsModule) {
    var isDirectory = false

    try {
      isDirectory = fs.lstatSync(jsModule).isDirectory()
    } catch (e) {}

    // Directory was passed; enumerate through and register contents
    if (isDirectory) {
      var modules = fs.readdirSync(jsModule)

      modules.forEach(function (mod) {
        if (path.extname(mod) === '.js' && path.basename(mod) !== 'index.js') {
          plugins.push({
            register: require(path.join(jsModule, mod))
          })
        }
      })
    // Single file was passed; register it
    } else {
      plugins.push({
        register: require(jsModule + '.js')
      })
    }
  })

  cli.register(plugins, function (err) {
    callback(err)
  })
}

/**
 * Initialize
 *
 * Registers commands and plugins
 */

cli.initialize = function (callback) {
  cli.registerModules([
    path.join(__dirname, 'lib', 'plugins', 'logger'),
    path.join(__dirname, 'lib', 'commands')
  ], callback)
}

/**
 * Exports
 */

module.exports = cli
