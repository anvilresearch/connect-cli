/**
 * Register JSON utilities
 */

function registerJSON (cli, options, done) {
  cli.fs.registerSerializer('json', function (obj, opts) {
    if (opts.pretty) {
      return JSON.stringify(obj, null, 2)
    } else {
      return JSON.stringify(obj)
    }
  })

  cli.fs.registerDeserializer('json', function (data, opts) {
    return JSON.parse(data)
  })

  done()
}

/**
 * Exports
 */

module.exports = registerJSON
