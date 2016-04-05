/**
 * Module dependencies
 */

var AnvilConnect = require('anvil-connect-nodejs')
var url = require('url')

/**
 * Client
 */

function registerClient (cli, options, done) {
  cli.client = {
    create: function (issuer) {
      var clientConfig = {
        issuer: issuer.issuer,
        client_id: issuer.client_id,
        client_secret: issuer.client_secret,
        redirect_uri: issuer.redirect_uri,
        agentOptions: {
          ca: undefined
        },
        provider: issuer.provider || 'password'
      }

      if (issuer.caCertPath) {
        try {
          clientConfig.agentOptions.ca = cli.fs.read(issuer.caCertPath)
        } catch (e) {
          throw new Error(
            'Could not read CA SSL certificate at ' + issuer.caCertPath
          )
        }
      }

      // Show a warning if the issuer is not using SSL
      var parsedIssuer = url.parse(issuer.issuer)
      if (parsedIssuer.protocol === 'http:') {
        cli.log.error('Warning: you are communicating over plain text.')
      }

      var client = new AnvilConnect(clientConfig)

      if (issuer.session) {
        client.tokens = issuer.session.tokens
      }

      return client
    }
  }

  done()
}

/**
 * Exports
 */

module.exports = registerClient
