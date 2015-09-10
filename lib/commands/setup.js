/* global process */

/**
 * Module dependencies
 */

var cwd = process.cwd()
var fs = require('fs')
var url = require('url')
var path = require('path')
var inquirer = require('inquirer')
var request = require('request-promise')
var AnvilConnect = require('anvil-connect-nodejs')

/**
 * Login command
 */

function registerSetup (cli, options, done) {
  cli.command('setup')
    .handler(function (data, flags, done) {
      var issuer = data[0]
      var setupTokenPath = flags.t || path.join(cwd, 'connect', 'keys', 'setup.token')
      var setupToken

      if (!issuer) {
        var configPath = path.join(cwd, 'connect', 'config', 'development.json')
        try {
          var config = require(configPath)

          if (!config || !config.issuer) {
            throw new Error()
          }

          issuer = config.issuer
        } catch(e) {
          cli.log.error('No issuer specified')
          process.exit(1)
        }
      }

      try {
        setupToken = fs.readFileSync(setupTokenPath).toString()
      } catch (e) {
        cli.log.error('Couldn\'t load the setup token')
        process.exit(1)
      }

      var anvil = new AnvilConnect({
        issuer: issuer
      })

      // Show a warning if the issuer is not using SSL
      var parsedIssuer = url.parse(issuer)
      if (parsedIssuer.protocol === 'http:') {
        cli.log.error('Warning: you are communicating over plain text.')
      }

      anvil.discover()
        .then(function (configuration) {
          inquirer.prompt([
            {
              type: 'input',
              name: 'email',
              message: 'Choose an email'
            },
            {
              type: 'password',
              name: 'password',
              message: 'Choose a password'
            },
            {
              type: 'input',
              name: 'issuerName',
              default: url.parse(anvil.configuration.issuer).host,
              message: 'Choose a name for this configuration'
            }
          ], function (answers) {
            request({
              uri: issuer + '/setup', // consider adding setup_uri to .well-known/openid-configuration
              method: 'POST',
              form: {
                email: answers.email,
                password: answers.password,
                token: setupToken
              },
              json: true
            })
            .then(function (setup) {
              try {
                cli.issuers.save({
                  name: answers.issuerName,
                  issuer: issuer,
                  client_id: setup.client && setup.client.client_id,
                  client_secret: setup.client && setup.client.client_secret,
                  redirect_uri: setup.client && setup.client.redirect_uris[0]
                })
              } catch (e) {
                cli.log.error('Couldn\'t write configuration file')
                process.exit(1)
              }

              cli.log('Your setup is complete. You may now log in with `$ nvl login`.')
              done()
            })
            .catch(function (err) {
              cli.log.error(err)
              process.exit(1)
            })
          })
        })
        .catch(function () {
          cli.log.error(issuer + ' does not point to an Anvil Connect server')
          process.exit(1)
        })
    })
  done()
}

/**
 * Export
 */

module.exports = registerSetup
