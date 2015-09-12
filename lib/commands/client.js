/* global process */

/**
 * Module dependencies
 */

var url = require('url')
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
                value: flags['name'] || flags.n,
                trim: true,
                required: true
              },
              {
                type: 'input',
                name: 'client_uri',
                message: 'Enter a URI',
                value: flags['uri'] || flags.u,
                format: 'url',
                trim: true
              },
              {
                type: 'input',
                name: 'logo_uri',
                message: 'Enter a logo URI',
                value: flags['logo-uri'] || flags.l,
                format: 'url',
                trim: true
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
                value: flags['response-type'] || flags.r
              },
              {
                type: 'checkbox',
                name: 'grant_types',
                message: 'Select grant types',
                choices: function (answers) {
                  var choices = [
                    { name: 'authorization_code', checked: true },
                    { name: 'implicit' },
                    { name: 'refresh_token' },
                    { name: 'client_credentials' }
                  ]

                  if (answers.response_types) {
                    if (
                      answers.response_types.indexOf('code') !== -1 ||
                      answers.response_types.indexOf('code id_token token') !== -1
                    ) {
                      choices[0].disabled = 'Required for code response type'
                    }
                    if (
                      answers.response_types.indexOf('id_token token') !== -1 ||
                      answers.response_types.indexOf('code id_token token') !== -1 ||
                      answers.response_types.indexOf('token') !== -1
                    ) {
                      choices[1].checked = true
                      choices[1].disabled = 'Required for token and/or id_token response types'
                    }
                  }

                  return choices
                },
                value: flags['grant-type'] || flags.g
              },
              {
                type: 'input',
                name: 'default_max_age',
                message: 'Set the default max age (in seconds)',
                default: 3600,
                value: flags['default-max-age'] || flags.d,
                dataType: 'integer',
                minimum: 0
              },
              {
                type: 'multiinput',
                name: 'redirect_uris',
                message: 'Define redirect URIs',
                format: 'url',
                required: true,
                trim: true,
                value: flags['redirect-uris'] || flags.s
              },
              {
                type: 'multiinput',
                name: 'post_logout_redirect_uris',
                message: 'Define post logout redirect URIs',
                format: 'url',
                trim: true,
                value: flags['post-logout-redirect-uris'] || flags.p
              }
            ], function (answers) {
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
