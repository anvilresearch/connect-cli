/**
 * Module dependencies
 */

var path = require('path')

/**
 * Config
 */

function registerConfig (cli, options, done) {
  var configFile = path.join(cli.env.nvl, 'config.yaml')

  cli.config = {
    data: {},

    load: function () {
      try {
        cli.config.data = cli.fs.read(configFile, 'yaml')
      } catch (e) {
        cli.config.data = {}
      }
    },

    save: function () {
      cli.fs.write(configFile, cli.config.data, 'yaml')
    }
  }

  cli.config.load()

  done()
}

/**
 * Exports
 */

module.exports = registerConfig
