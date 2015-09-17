/* global __dirname */

// Ensure running a compatible version of Node before getting too far...
var semver = require('semver')
var packageJson = require('./package.json')
if (packageJson.engines &&
    packageJson.engines.node &&
    !semver.satisfies(process.versions.node, packageJson.engines.node)) {
    console.error('Incompatible version of node - running [%s] but require [%s]',
            process.versions.node, packageJson.engines.node)
    process.exit(1)
}


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
    path.join(__dirname, 'lib', 'plugins', 'env'),
    path.join(__dirname, 'lib', 'plugins', 'fs'),
    path.join(__dirname, 'lib', 'plugins', 'json'),
    path.join(__dirname, 'lib', 'plugins', 'yaml'),
    path.join(__dirname, 'lib', 'plugins', 'prompt'),
    path.join(__dirname, 'lib', 'plugins', 'config'),
    path.join(__dirname, 'lib', 'plugins', 'issuers'),
    path.join(__dirname, 'lib', 'plugins', 'client'),
    path.join(__dirname, 'lib', 'plugins', 'login'),
    path.join(__dirname, 'lib', 'commands')
  ], callback)
}

/**
 * Exports
 */

module.exports = cli
