/**
 * Module dependencies
 */

var path = require('path')

/**
 * Anvil Connect CLI Version
 */

function registerVersion (cli, options, done) {
  cli.command('version')
    .handler(function (data, flags, done) {
      var pkg = require(path.join(__dirname, '..', '..', 'package.json'))
      cli.log('Version', pkg.version)
      done()
    })

  done()
}

/**
 * Export
 */

module.exports = registerVersion
