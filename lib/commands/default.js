/**
 * Default
 */

function registerDefault (cli, options, done) {
  cli.default()
    .handler(function (data, flags, done) {
      var log = cli.log
      var logo = cli.get('logo')
      var website = cli.get('website')
      var description = cli.get('description')

      log.header(logo)
      log.link(website)
      log()
      log.header(description)
      log()
      done()
    })

  done()
}

/**
 * Exports
 */

module.exports = registerDefault
