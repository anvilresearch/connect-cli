/**
 * Module dependencies
 */

var format = require('../format')

/**
 * Logger
 */

function registerLogger (cli, options, done) {
  // expose a plain log method
  cli.log = function (data) { console.log(data) }

  // register log methods for each format
  Object.keys(format).forEach(function (key) {
    cli.log[key] = function (data) {
      console.log(format[key](data))
    }
  })

  // constants
  cli.log.br = function () { console.log() }
  done()
}

/**
 * Exports
 */

module.exports = registerLogger
