/**
 * Module dependencies
 */

var yaml = require('js-yaml')

/**
 * Register YAML utilities
 */

function registerYAML (cli, options, done) {
  cli.fs.registerSerializer('yaml', function (obj, opts) {
    opts = opts || {}

    var copy = {}

    Object.getOwnPropertyNames(obj).forEach(function (prop) {
      if (typeof obj[prop] !== 'undefined') {
        copy[prop] = obj[prop]
      }
    })

    if (opts.unsafe) {
      return yaml.dump(copy, opts)
    } else {
      return yaml.safeDump(copy, opts)
    }
  })

  cli.fs.registerDeserializer('yaml', function (data, opts) {
    opts = opts || {}

    if (opts.unsafe) {
      return yaml.load(data, opts)
    } else {
      return yaml.safeLoad(data, opts)
    }
  })

  done()
}

/**
 * Exports
 */

module.exports = registerYAML
