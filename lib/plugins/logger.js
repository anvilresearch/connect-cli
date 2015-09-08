/**
 * Module dependencies
 */

var format = require('../format')

/**
 * Logger
 */

function registerLogger (cli, options, done) {
  // expose a plain log method
  cli.log = function () {
    console.log.apply(console, arguments)
  }

  // register log methods for each format
  Object.keys(format).forEach(function (key) {
    cli.log[key] = function () {
      var args = Array.prototype.slice.call(arguments)

      if (args.length > 0) {
        args[0] = format[key](args[0])
      } else {
        args.push(format[key](''))
      }

      console.log.apply(console, args)
    }
  })

  done()
}

/**
 * Exports
 */

module.exports = registerLogger
