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

    if (opts.unsafe) {
      return yaml.dump(obj, opts)
    } else {
      return yaml.safeDump(obj, opts)
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
