/* global process */

/**
 * Module dependencies
 */

var url = require('url')
var inquirer = require('inquirer')
var AnvilConnect = require('anvil-connect-nodejs')

/**
 * Login command
 */

function registerLogin (cli, options, done) {
  cli.command('login')
    .handler(function (data, flags, done) {
      cli.issuers.prompt(data[0], function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        var anvil = new AnvilConnect(issuer)

        // Show a warning if the issuer is not using SSL
        var parsedIssuer = url.parse(issuer.issuer)
        if (parsedIssuer.protocol === 'http:') {
          cli.log.error('Warning: you are communicating over plain text.')
        }

        // get the provider configuration
        anvil.discover()
          .then(function (configuration) {
            // prompt for email and password
            inquirer.prompt([
              {
                type: 'input',
                name: 'email',
                message: 'Enter your email'
              },
              {
                type: 'password',
                name: 'password',
                message: 'Enter your password'
              }
            ], function (answers) {
              anvil
                // get the provider's public keys
                .getJWKs()

                // login
                .then(function (jwks) {
                  return anvil.login(answers.email, answers.password)
                })

                // store the tokens
                .then(function (tokens) {
                  issuer.session.tokens = tokens

                  try {
                    cli.issuers.save(issuer)
                  } catch (e) {
                    cli.log.error(e)
                    process.exit(1)
                  }

                  cli.log('You have been successfully logged in to ' + issuer.name)
                  done()
                })

                .catch(function (err) {
                  cli.log.error(err)
                  done()
                })
            })
          })
          .catch(function () {
            cli.log.error(issuer.issuer + ' does not point to an Anvil Connect server')
            process.exit(1)
          })
      })
    })
  done()
}

/**
 * Export
 */

module.exports = registerLogin
