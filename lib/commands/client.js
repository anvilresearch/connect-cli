/* global process, Promise */

/**
 * Module dependencies
 */

var chalk = require('chalk')
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
    if (err.statusCode && [401, 403].indexOf(err.statusCode) !== -1) {
      cli.log.error('Please login to the issuer.')
    } else {
      console.log(err)
    }

    process.exit(1)
  }

  clientCmd
    .handler(function (data, flags, done) {
      cli.log('Usage:')
      cli.log(
        '  nvl client:register [--issuer | -i <issuer id>] [--trusted | -t]' +
        '[--name | -n <name>] [--uri | -u <uri>]\n\t' +
        '[--logo-uri | -l <logo uri>] [--application-type | -a <app type>]\n\t' +
        '[--response-type | -r <response type>] [--grant-type | -g <grant type>]\n\t' +
        '[--default-max-age | -d <seconds>] [--redirect-uri | -s <redirect uri>]\n\t' +
        '[--post-logout-redirect-uri | -p <post logout redirect uri>]'
      )

      cli.log('  nvl client:list [--issuer | -i <issuer id>]')

      cli.log('  nvl client:info [<id>] [--issuer | -i <issuer id>]')

      cli.log(
        '  nvl client:update [<id>] [--issuer | -i <issuer id>] [--trusted | -t] [--untrusted | -U]\n\t' +
        '[--name | -n <name>] [--uri | -u <uri>]\n\t' +
        '[--logo-uri | -l <logo uri>] [--application-type | -a <app type>]\n\t' +
        '[--response-type | -r <response type>] [--grant-type | -g <grant type>]\n\t' +
        '[--default-max-age | -d <seconds>] [--redirect-uri | -s <redirect uri>]\n\t' +
        '[--post-logout-redirect-uri | -p <post logout redirect uri>]'
      )

      cli.log('  nvl client:delete [<id>] [--issuer | -i <issuer id>]')

      cli.log('  nvl client:token [--issuer | -i <issuer id>]')

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
                value: flags['redirect-uri'] || flags.s
              },
              {
                type: 'multiinput',
                name: 'post_logout_redirect_uris',
                message: 'Define post logout redirect URIs',
                format: 'url',
                trim: true,
                value: flags['post-logout-redirect-uri'] || flags.p
              }
            ], function (answers) {
              // register the client
              anvil.clients.create(answers, { token: anvil.tokens.access_token })
                .then(function (registration) {
                  cli.log.json(registration)
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
            return anvil.clients.list({ token: anvil.tokens.access_token })
          })
          .then(function (clients) {
            cli.log.json(clients.map(function (client) {
              return {
                _id: client._id,
                client_name: client.client_name,
                trusted: client.trusted
              }
            }))

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
                anvil.clients.list({ token: anvil.tokens.access_token })
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
            return anvil.clients.get(clientId, { token: anvil.tokens.access_token })
          })
          .then(function (data) {
            cli.log.json(data)
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
                anvil.clients.list({ token: anvil.tokens.access_token })
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
            return anvil.clients.get(clientId, { token: anvil.tokens.access_token })
          })
          .then(function (client) {
            return new Promise(function (resolve, reject) {
              cli.prompt([
                {
                  type: 'confirm',
                  name: 'trusted',
                  message: 'Will this be a trusted client?',
                  value: function () {
                    var trustedFlag = flags['trusted'] || flags.t
                    if (typeof trustedFlag !== 'undefined') { return true }

                    var untrustedFlag = flags['untrusted'] || flags.U
                    if (typeof untrustedFlag !== 'undefined') { return false }
                  },
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
                  value: flags['redirect-uri'] || flags.s,
                  default: client.redirect_uris
                },
                {
                  type: 'multiinput',
                  name: 'post_logout_redirect_uris',
                  message: 'Define post logout redirect URIs',
                  format: 'url',
                  trim: true,
                  value: flags['post-logout-redirect-uri'] || flags.p,
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
            return anvil.clients.update(data.client._id, data.update, { token: anvil.tokens.access_token })
          })
          .then(function (data) {
            cli.log.json(data)
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
                anvil.clients.list({ token: anvil.tokens.access_token })
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
            // Forbid deleting the client currently in use
            if (issuer.client_id === clientId) {
              throw new Error('Deleting the client you are currently using is forbidden')
            }

            return anvil.clients.delete(clientId, { token: anvil.tokens.access_token })
          })
          .then(function () {
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Client token
   */

  clientCmd
    .task('token')
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
            anvil.configuration = configuration
            return anvil.getJWKs()
          })
          .then(function (jwks) {
            return new Promise(function (resolve, reject) {
              if (data[0]) {
                resolve(data[0])
              } else {
                Promise.all([
                  anvil.clients.list({ token: anvil.tokens.access_token }),
                  anvil.scopes.list({ token: anvil.tokens.access_token })
                ])
                .then(function (data) {
                  var clients = data[0]
                  var scopes = data[1]

                  cli.prompt([
                    {
                      type: 'list',
                      name: 'client',
                      message: 'Select a client',
                      choices: clients.map(function (client) {
                        return {
                          name: client.client_name + ' – ' + chalk.yellow(client._id),
                          value: client
                        }
                      })
                    },
                    {
                      type: 'checkbox',
                      name: 'scopeNames',
                      message: 'Select scopes',
                      choices: scopes.map(function (scope) {
                        return {
                          name: scope.name,
                          value: scope.name
                        }
                      })
                    }
                  ], function (answers) {
                    resolve(answers)
                  })
                })
                .catch(reject)
              }
            })
          })
          .then(function (answers) {
            return request({
              json: true,
              url: anvil.configuration.token_endpoint,
              method: 'POST',
              form: {
                grant_type: 'client_credentials',
                scope: answers.scopeNames.join(' ')
              },
              auth: {
                user: answers.client._id,
                pass: answers.client.client_secret
              },
              agentOptions: anvil.agentOptions
            })
            .then(function (response) {
              /* TODO : Client token should be verified however
               *      : server issues token without an expiration
               */

              // cli.log(anvil.verify(response.access_token, {
              //   issuer: anvil.issuer,
              //   client_id: client._id,
              //   client_secret: client.client_secret,
              //   scope: "realm",
              //   key: anvil.jwks.sig
              // }))

              cli.log.json(response)
            })
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
