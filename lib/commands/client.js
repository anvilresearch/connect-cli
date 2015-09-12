/* global process */

/**
 * Module dependencies
 */

var url = require('url')
var inquirer = require('inquirer')
var AnvilConnect = require('anvil-connect-nodejs')

/**
 * Client commands
 */

function registerClient (cli, options, done) {
  var clientCmd = cli.command('client')

  clientCmd
    .handler(function (data, flags, done) {
      done()
    })

  clientCmd
    .task('register')
    .handler(function (data, flags, done) {
      cli.issuers.prompt(data[0], function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        var anvil = new AnvilConnect(issuer)
        anvil.tokens = issuer.session.tokens

        // Show a warning if the issuer is not using SSL
        var parsedIssuer = url.parse(issuer.issuer)
        if (parsedIssuer.protocol === 'http:') {
          cli.log.error('Warning: you are communicating over plain text.')
        }

        anvil.discover()
          .then(function (configuration) {
            cli.prompt([
              {
                type: 'confirm',
                name: 'trusted',
                message: 'Will this be a trusted client?',
                value: flags['trusted'] || flags.t
              },
              {
                type: 'input',
                name: 'client_name',
                message: 'Enter a name',
                value: flags['name'] || flags.n
              },
              {
                type: 'input',
                name: 'client_uri',
                message: 'Enter a URI',
                value: flags['uri'] || flags.u
              },
              {
                type: 'input',
                name: 'logo_uri',
                message: 'Enter a logo URI',
                value: flags['logo'] || flags.l
              },
              {
                type: 'list',
                name: 'application_type',
                message: 'Choose an application type',
                choices: ['web', 'native', 'service'],
                default: 'web',
                value: flags['application-type'] || flags.a

              },
              {
                type: 'checkbox',
                name: 'response_types',
                message: 'Select response types',
                choices: [
                  { name: 'code', checked: true },
                  { name: 'id_token token' },
                  { name: 'code id_token token' },
                  { name: 'token' },
                  { name: 'none' }
                ],
                value: function () {
                  var flag = flags['response-type'] || flags.r
                  if (typeof flag === 'string') {
                    flag = [flag]
                  }
                  return flag
                }
              },
              {
                type: 'checkbox',
                name: 'grant_types',
                message: 'Select grant types',
                choices: [
                  { name: 'authorization_code', checked: true },
                  { name: 'implicit' },
                  { name: 'refresh_token' },
                  { name: 'client_credentials' }
                ],
                value: function () {
                  var flag = flags['grant-type'] || flags.g
                  if (typeof flag === 'string') {
                    flag = [flag]
                  }
                  return flag
                }
              },
              {
                type: 'input',
                name: 'default_max_age',
                message: 'Set the default max age (in seconds)',
                filter: function (val) { return parseInt(val) },
                default: 3600,
                value: flags['default-max-age'] || flags.d
              },
              {
                type: 'input',
                name: 'redirect_uris',
                message: 'Define redirect URIs',
                filter: function (val) {
                  var values = val.split(',')
                  return values.length > 0 && values
                },
                value: function () {
                  var flag = flags['redirect-uris'] || flags.s
                  if (typeof flag === 'string') {
                    flag = [flag]
                  }
                  return flag
                }
              },
              {
                type: 'input',
                name: 'post_logout_redirect_uris',
                message: 'Define post logout redirect URIs',
                filter: function (val) {
                  var values = val.split(',')
                  return values
                },
                value: function () {
                  var flag = flags['post-logout-redirect-uris'] || flags.p
                  if (typeof flag === 'string') {
                    flag = [flag]
                  }
                  return flag
                }
              }
            ], function (answers) {
              // delete blank strings
              Object.keys(answers).forEach(function (key) {
                if (!answers[key]) {
                  delete answers[key]
                }
              })

              // register the client
              anvil.register(answers)
                .then(function (registration) {
                  cli.log()
                  cli.log('Successfully registered a new client:')
                  cli.log('Client ID:\t' + registration.client_id)
                  cli.log('Client Secret:\t' + registration.client_secret)
                  cli.log()
                  done()
                })
                // registration error
                .catch(function (err) {
                  cli.log(err.error)
                  process.exit(1)
                })
            })
          })
          // discover error
          .catch(function (err) {
            console.log(err)
            process.exit(1)
          })
      })
    })
  done()
}

/**
 * Exports
 */

module.exports = registerClient
