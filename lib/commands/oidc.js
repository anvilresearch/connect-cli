/* global process */

/**
 * OIDC Configuration Command
 */

function registerOIDC (cli, options, done) {
  var cmd = cli.command('oidc')

  cmd.task('config')
    .handler(function (data, flags, done) {
      cli.issuers.prompt(data[0], function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        try {
          var anvil = cli.client.create(issuer)
        } catch (e) {
          cli.log.error(e)
          process.exit(1)
        }

        anvil.discover()
          .then(function (configuration) {
            cli.log.json(configuration)
          })
          .catch(function (err) {
            cli.log.error(err)
          })
      })
    })

  done()
}

module.exports = registerOIDC
