/* global process, Promise */

/**
 * Module dependencies
 */

var chalk = require('chalk')
var Table = require('cli-table')

/**
 * Client commands
 */

function registerClient (cli, options, done) {
  var clientCmd = cli.command('client')

  /**
   * API Error Response Handler
   */

  function apiError (err) {
    if (err.statusCode && [401, 403].indexOf(err.statusCode) !== -1) {
      cli.log.error('Please login to the issuer.')
    } else {
      console.log(err)
    }

    process.exit(1)
  }

  /**
   * Display Field
   */

  function displayField (key, value, format) {
    if (typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0)) {
      // determine the number of tab characters to use
      var tabs = '\t'
      var diff = 24 - key.length
      if (diff > 8) { tabs += '\t' }
      if (diff > 16) { tabs += '\t' }

      // format the value
      if (Array.isArray(value)) {
        value = value.map(function (item) {
          return (format) ? chalk[format](item) : item
        }).join('\n\t\t\t')
      } else {
        value = (format) ? chalk[format](value) : value
      }

      cli.log(key + tabs + value)
    }
  }

  /**
   * Display Client
   */

  function displayClient (data) {
    cli.log()
    displayField('Name', data.client_name, 'bold')
    displayField('Client ID', data._id, 'yellow')
    displayField('Client Secret', data.client_secret, 'yellow')
    displayField('Client URI', data.client_uri, 'cyan')
    displayField('Application type', data.application_type)
    displayField('Response types', data.response_types)
    displayField('Grant types', data.grant_types)
    displayField('Token auth method', data.token_endpoint_auth_method)
    displayField('Default max age', data.default_max_age)
    displayField('Redirect URIs', data.redirect_uris, 'cyan')
    displayField('Logout Redirect URIs', data.post_logout_redirect_uris, 'cyan')
    displayField('User ID', data.userId, 'yellow')
    displayField('Trusted', data.trusted || false, (data.trusted) ? 'green' : 'gray')
    displayField('Scopes', data.scopes)
    displayField('Created', data.created && new Date(data.created))
    displayField('Modified', data.modified && new Date(data.modified))
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
              anvil.clients.create(answers)
                .then(function (registration) {
                  displayClient(registration)
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
            displayClient(data)
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
          .then(function (client) {
            return new Promise(function (resolve, reject) {
              cli.prompt([
                {
                  type: 'confirm',
                  name: 'trusted',
                  message: 'Will this be a trusted client?',
                  value: (typeof (flags['trusted'] || flags.t) !== 'undefined') || undefined,
                  default: client.trusted
                },
                {
                  type: 'input',
                  name: 'client_name',
                  message: 'Enter a name',
                  value: flags['name'] || flags.n,
                  trim: true,
                  default: client.client_name
                },
                {
                  type: 'input',
                  name: 'client_uri',
                  message: 'Enter a URI',
                  value: flags['uri'] || flags.u,
                  format: 'url',
                  trim: true,
                  default: client.client_uri
                },
                {
                  type: 'input',
                  name: 'logo_uri',
                  message: 'Enter a logo URI',
                  value: flags['logo-uri'] || flags.l,
                  format: 'url',
                  trim: true,
                  default: client.logo_uri
                },
                {
                  type: 'list',
                  name: 'application_type',
                  message: 'Choose an application type',
                  choices: ['web', 'native', 'service'],
                  value: flags['application-type'] || flags.a,
                  default: client.application_type
                },
                {
                  type: 'checkbox',
                  name: 'response_types',
                  message: 'Select response types',
                  choices: function (answers) {
                    var choices = [
                      { name: 'code' },
                      { name: 'id_token token' },
                      { name: 'code id_token token' },
                      { name: 'token' },
                      { name: 'none' }
                    ]

                    if (client.response_types) {
                      if (client.response_types.indexOf('code') !== -1) {
                        choices[0].checked = true
                      }

                      if (
                        client.response_types.indexOf('id_token token') !== -1 ||
                        client.response_types.indexOf('token id_token') !== -1
                      ) {
                        choices[1].checked = true
                      }

                      if (
                        client.response_types.indexOf('code id_token token') !== -1 ||
                        client.response_types.indexOf('code token id_token') !== -1 ||
                        client.response_types.indexOf('id_token code token') !== -1 ||
                        client.response_types.indexOf('id_token token code') !== -1 ||
                        client.response_types.indexOf('token code id_token') !== -1 ||
                        client.response_types.indexOf('token id_token code') !== -1
                      ) {
                        choices[2].checked = true
                      }

                      if (client.response_types.indexOf('token') !== -1) {
                        choices[3].checked = true
                      }

                      if (client.response_types.indexOf('none') !== -1) {
                        choices[4].checked = true
                      }

                      return choices
                    }
                  },
                  value: flags['response-type'] || flags.r
                },
                {
                  type: 'checkbox',
                  name: 'grant_types',
                  message: 'Select grant types',
                  choices: function (answers) {
                    var choices = [
                      { name: 'authorization_code' },
                      { name: 'implicit' },
                      { name: 'refresh_token' },
                      { name: 'client_credentials' }
                    ]

                    if (client.grant_types) {
                      if (client.grant_types.indexOf('authorization_code') !== -1) {
                        choices[0].checked = true
                      }

                      if (client.grant_types.indexOf('implicit') !== -1) {
                        choices[1].checked = true
                      }

                      if (client.grant_types.indexOf('refresh_token') !== -1) {
                        choices[2].checked = true
                      }

                      if (client.grant_types.indexOf('client_credentials') !== -1) {
                        choices[3].checked = true
                      }
                    }

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
                  default: client.default_max_age,
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
                  value: flags['redirect-uris'] || flags.s,
                  default: client.redirect_uris
                },
                {
                  type: 'multiinput',
                  name: 'post_logout_redirect_uris',
                  message: 'Define post logout redirect URIs',
                  format: 'url',
                  trim: true,
                  value: flags['post-logout-redirect-uris'] || flags.p,
                  default: client.post_logout_redirect_uris
                }
              ], function (update) {
                resolve({
                  client: client,
                  update: update
                })
              })
            })
          })
          .then(function (data) {
            return anvil.clients.update(data.client._id, data.update)
          })
          .then(function (data) {
            displayClient(data)
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
