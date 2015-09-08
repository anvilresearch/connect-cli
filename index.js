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
 * Register directories
 *
 * Requires and registers a directory of plugins.
 */

cli.registerDirectories = function (directories, callback) {
  var plugins = []

  directories.forEach(function (directory) {
    var modules = fs.readdirSync(directory)

    modules.forEach(function (mod) {
      if (path.extname(mod) === '.js' && path.basename(mod) !== 'index.js') {
        plugins.push({
          register: require(path.join(directory, mod))
        })
      }
    })
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
  cli.registerDirectories([
    path.join(__dirname, 'lib', 'commands'),
    path.join(__dirname, 'lib', 'plugins')
  ], callback)
}

/**
 * Exports
 */

module.exports = cli
