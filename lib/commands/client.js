/* global process */

/**
 * Module dependencies
 */

var chalk = require('chalk')
var Table = require('cli-table')
var request = require('request-promise')

/**
 * Client commands
 */

function registerClient (cli, options, done) {
  var clientCmd = cli.command('client')

  /**
   * API Error Response Handler
   */

  function apiError (err) {
    if (err.statusCode && [401,403].indexOf(err.statusCode) !== -1) {
      cli.log.error('Please login to the issuer.')
    } else {
      console.log(err)
    }

    process.exit(1)
  }

  clientCmd
    .handler(function (data, flags, done) {
      done()
    })

  /**
   * Client registration
   */

  clientCmd
    .task('register')
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
            cli.prompt([
              {
                type: 'confirm',
                name: 'trusted',
                message: 'Will this be a trusted client?',
                value: flags['trusted'] || flags.t,
                default: false
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
                .catch(apiError)
            })
          })
          // discover error
          .catch(apiError)
      })
    })

  /**
   * Client list
   */

  clientCmd
    .task('list')
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
            return anvil.clients.list()
          })
          .then(function (clients) {
            var table = new Table({
              head: ['Name', 'Client ID', 'URI']
            })

            clients.forEach(function (client) {
              var name = chalk.bold(client.client_name)
              var clientId = chalk.yellow(client._id)
              var uri = (client.client_uri) ? chalk.cyan(client.client_uri) : ''
              table.push([name, clientId, uri])
            })

            cli.log(table.toString())
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Client info
   */

  clientCmd
    .task('info')
    .handler(function (data, flags, done) {
      cli.issuers.prompt(flags['issuer'] || flags.i, function (err, issuer) {
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
            return new Promise(function (resolve, reject) {
              if (data[0]) {
                resolve(data[0])
              } else {
                anvil.clients.list()
                  .then(function (clients) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'clientId',
                        message: 'Select a client',
                        choices: clients.map(function (client) {
                          return {
                            name: client.client_name + ' – ' + chalk.yellow(client._id),
                            value: client._id
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.clientId)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (clientId) {
            return anvil.clients.get(clientId)
          })
          .then(function (data) {
            cli.log()
            cli.log('Name:\t\t\t' + chalk.bold(data.client_name))
            cli.log('Client ID\t\t' + chalk.yellow(data._id))
            cli.log('Client Secret\t\t' + chalk.yellow(data.client_secret))
            cli.log('Client URI\t\t' + chalk.cyan(data.client_uri))
            cli.log('Application type\t' + data.application_type)
            cli.log('Response types\t\t' + data.response_types)
            cli.log('Grant types\t\t' + data.grant_types)
            cli.log('Token auth method\t' + data.token_endpoint_auth_method)
            cli.log('Default max age\t\t' + data.default_max_age)
            cli.log('Redirect URIs\t\t' + data.redirect_uris.map(function (uri) {
              return chalk.cyan(uri)
            }).join('\n\t\t\t'))
            cli.log('Logout Redirect URIs\t' + data.post_logout_redirect_uris.map(function (uri) {
              return chalk.cyan(uri)
            }).join('\n\t\t\t'))
            cli.log('User ID\t\t\t' + chalk.yellow(data.userId))
            cli.log('Trusted\t\t\t' + chalk[data.trusted ? 'green' : 'gray'](data.trusted))
            cli.log('Scopes:\t\t\t' + data.scopes)
            cli.log('Created\t\t\t' + new Date(data.created))
            cli.log('Modified\t\t' + new Date(data.modified))
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Client update
   */

  clientCmd
    .task('update')
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
            return new Promise(function (resolve, reject) {
              if (data[0]) {
                resolve(data[0])
              } else {
                anvil.clients.list()
                  .then(function (clients) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'clientId',
                        message: 'Select a client',
                        choices: clients.map(function (client) {
                          return {
                            name: client.client_name + ' – ' + chalk.yellow(client._id),
                            value: client._id
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.clientId)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (clientId) {
            return anvil.clients.update(clientId, {})
          })
          .then(function (data) {
            console.log(data)
            done()
          })
          .catch(apiError)
      })
    })


  /**
   * Client delete
   */

  clientCmd
    .task('delete')
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
            return new Promise(function (resolve, reject) {
              if (data[0]) {
                resolve(data[0])
              } else {
                anvil.clients.list()
                  .then(function (clients) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'clientId',
                        message: 'Select a client',
                        choices: clients.map(function (client) {
                          return {
                            name: client.client_name + ' – ' + chalk.yellow(client._id),
                            value: client._id
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.clientId)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (clientId) {
            return anvil.clients.delete(clientId)
          })
          .then(function () {
            done()
          })
          .catch(apiError)
      })
    })


  done()
}

/**
 * Exports
 */

module.exports = registerClient
