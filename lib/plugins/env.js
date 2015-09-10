/* global process */

/**
 * Module dependencies
 */

var path = require('path')

/**
 * Environment
 */

var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']

function registerEnv (cli, options, done) {
  cli.env = {
    home: home,
    nvl: path.join(home, '.nvl')
  }

  done()
}

/**
 * Exports
 */

module.exports = registerEnv
