/* global process, Promise */

/**
 * Scope commands
 */

function registerScope (cli, options, done) {
  var scopeCmd = cli.command('scope')

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

  scopeCmd
    .handler(function (data, flags, done) {
      cli.log('Usage:')
      cli.log(
        '  nvl scope:register [<id>] [--issuer | -i <issuer id>] [--name | -n <name>]\n\t' +
        '[--description | -d <description>] [--restricted | -r]'
      )

      cli.log('  nvl scope:list [--issuer | -i <issuer id>]')

      cli.log('  nvl scope:info [<id>] [--issuer | -i <issuer id>]')

      cli.log(
        '  nvl scope:update [<id>] [--issuer | -i <issuer id>] [--name | -n <name>]\n\t' +
        '[--description | -d <description>] [--restricted | -r]'
      )

      cli.log('  nvl scope:delete [<id>] [--issuer | -i <issuer id>]')

      done()
    })

  /**
   * Scope registration
   */

  scopeCmd
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
                type: 'input',
                name: 'name',
                message: 'Name',
                value: flags['name'] || flags.n,
                trim: true
              },
              {
                type: 'input',
                name: 'description',
                message: 'Description',
                value: flags['description'] || flags.d,
                trim: true
              },
              {
                type: 'confirm',
                name: 'restricted',
                message: 'Restricted',
                value: flags['restricted'] || flags.r,
                trim: true
              }
            ], function (answers) {
              // register the scope
              anvil.scopes.create(answers, { token: anvil.tokens.access_token })
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
   * Scope list
   */

  scopeCmd
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
            return anvil.scopes.list({ token: anvil.tokens.access_token })
          })
          .then(function (scopes) {
            scopes.forEach(function (scope) {
              cli.log.json({
                'name': scope.name,
                'description': scope.description,
                'restricted': scope.restricted
              })
            })

            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Scope info
   */

  scopeCmd
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
                anvil.scopes.list({ token: anvil.tokens.access_token })
                  .then(function (scopes) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'scopeName',
                        message: 'Select a scope',
                        choices: scopes.map(function (scope) {
                          return {
                            name: scope.name,
                            value: scope.name
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.scopeName)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (scopeName) {
            return anvil.scopes.get(scopeName, { token: anvil.tokens.access_token })
          })
          .then(function (data) {
            cli.log.json(data)
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Scope update
   */

  scopeCmd
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
                anvil.scopes.list({ token: anvil.tokens.access_token })
                  .then(function (scopes) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'scopeName',
                        message: 'Select a scope',
                        choices: scopes.map(function (scope) {
                          return {
                            name: scope.name,
                            value: scope.name
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.scopeName)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (scopeName) {
            return anvil.scopes.get(scopeName, { token: anvil.tokens.access_token })
          })
          .then(function (scope) {
            return new Promise(function (resolve, reject) {
              cli.prompt([
                {
                  type: 'input',
                  name: 'name',
                  message: 'Name',
                  value: flags['name'] || flags.n,
                  default: scope.name,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'description',
                  message: 'Description',
                  value: flags['description'] || flags.d,
                  default: scope.description,
                  trim: true
                },
                {
                  type: 'confirm',
                  name: 'restricted',
                  message: 'Restricted',
                  value: flags['restricted'] || flags.r,
                  default: scope.restricted,
                  trim: true
                }
              ], function (update) {
                // Don't allow updating of required scopes
                var requiredScopes = ['openid', 'profile', 'email', 'address', 'phone', 'realm']
                var isRequired = requiredScopes.indexOf(scope.name) !== -1

                if (isRequired && scope.name !== update.name) {
                  return reject(new Error('This scope cannot be updated with a new name'))
                }

                resolve({
                  scope: scope,
                  update: update
                })
              })
            })
          })
          .then(function (data) {
            return anvil.scopes.update(data.scope.name, data.update, { token: anvil.tokens.access_token })
          })
          .then(function (data) {
            cli.log.json(data)
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Scope delete
   */

  scopeCmd
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
                anvil.scopes.list({ token: anvil.tokens.access_token })
                  .then(function (scopes) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'scopeName',
                        message: 'Select a scope',
                        choices: scopes.map(function (scope) {
                          return {
                            name: scope.name,
                            value: scope.name
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.scopeName)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (scopeName) {
            // Don't allow deletion of required scopes
            if (['openid', 'profile', 'email', 'address', 'phone', 'realm'].indexOf(scopeName) !== -1) {
              throw new Error('This scope cannot be deleted')
            }

            return anvil.scopes.delete(scopeName, { token: anvil.tokens.access_token })
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

module.exports = registerScope
