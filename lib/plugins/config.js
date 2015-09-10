/* global process */

/**
 * Module dependencies
 */

var mkdirp = require('mkdirp')
var yaml = require('js-yaml')
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
        return cli.fs.readYAML(configFile)
      } catch (e) {
        cli.config.data = {}
      }
    },

    save: function (overwrite) {
      cli.fs.writeYAML(configFile, cli.config.data, overwrite)
    }
  }

  cli.config.load()

  done()
}

/**
 * Exports
 */

module.exports = registerConfig
