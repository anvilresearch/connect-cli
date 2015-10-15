/* global process, Promise */

/**
 * Module dependencies
 */

var chalk = require('chalk')
var Table = require('cli-table')

/**
 * Role commands
 */

function registerRole (cli, options, done) {
  var roleCmd = cli.command('role')

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
   * Display Role
   */

  function displayRole (data) {
    cli.log()
    displayField('Name', data.name, 'bold')
    displayField('Created', data.created && new Date(data.created))
    displayField('Modified', data.modified && new Date(data.modified))
  }

  roleCmd
    .handler(function (data, flags, done) {
      cli.log('Usage:')
      cli.log(
        '  nvl role:register [<id>] [--issuer | -i <issuer id>] [--name | -n <name>]'
      )

      cli.log('  nvl role:list [--issuer | -i <issuer id>]')

      cli.log('  nvl role:info [<id>] [--issuer | -i <issuer id>]')

      cli.log(
        '  nvl role:update [<id>] [--issuer | -i <issuer id>] [--name | -n <name>]'
      )

      cli.log('  nvl role:delete [<id>] [--issuer | -i <issuer id>]')

      done()
    })

  /**
   * Role registration
   */

  roleCmd
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
              }
            ], function (answers) {
              // register the role
              anvil.roles.create(answers, { token: anvil.tokens.access_token })
                .then(function (registration) {
                  displayRole(registration)
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
   * Role list
   */

  roleCmd
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
            return anvil.roles.list({ token: anvil.tokens.access_token })
          })
          .then(function (roles) {
            var table = new Table({
              head: ['Name']
            })

            roles.forEach(function (role) {
              var name = chalk.bold(role.name)
              table.push([name])
            })

            cli.log(table.toString())
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Role info
   */

  roleCmd
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
                anvil.roles.list({ token: anvil.tokens.access_token })
                  .then(function (roles) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'roleName',
                        message: 'Select a role',
                        choices: roles.map(function (role) {
                          return {
                            name: role.name,
                            value: role.name
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.roleName)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (roleName) {
            return anvil.roles.get(roleName, { token: anvil.tokens.access_token })
          })
          .then(function (data) {
            displayRole(data)
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Role update
   */

  roleCmd
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
                anvil.roles.list({ token: anvil.tokens.access_token })
                  .then(function (roles) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'roleName',
                        message: 'Select a role',
                        choices: roles.map(function (role) {
                          return {
                            name: role.name,
                            value: role.name
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.roleName)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (roleName) {
            return anvil.roles.get(roleName, { token: anvil.tokens.access_token })
          })
          .then(function (role) {
            return new Promise(function (resolve, reject) {
              cli.prompt([
                {
                  type: 'input',
                  name: 'name',
                  message: 'Name',
                  value: flags['name'] || flags.n,
                  default: role.name,
                  trim: true
                }
              ], function (update) {
                resolve({
                  role: role,
                  update: update
                })
              })
            })
          })
          .then(function (data) {
            // Don't allow updating of required roles
            if (['authority'].indexOf(data.role.name) !== -1) {
              throw new Error('This role cannot be updated')
            }

            return anvil.roles.update(data.role.name, data.update, { token: anvil.tokens.access_token })
          })
          .then(function (data) {
            displayRole(data)
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Role delete
   */

  roleCmd
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
                anvil.roles.list({ token: anvil.tokens.access_token })
                  .then(function (roles) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'roleName',
                        message: 'Select a role',
                        choices: roles.map(function (role) {
                          return {
                            name: role.name,
                            value: role.name
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.roleName)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (roleName) {
            // Don't allow deletion of required roles
            if (['authority'].indexOf(roleName) !== -1) {
              throw new Error('This role cannot be deleted')
            }

            return anvil.roles.delete(roleName, { token: anvil.tokens.access_token })
          })
          .then(function () {
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Scope list
   */

  roleCmd
    .task('scopes')
    .handler(function (data, flags, done) {
      cli.issuers.prompt(flags['issuer'] || flags.i, function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        try {
          var anvil = cli.client.create(issuer)
          var token = anvil.tokens.access_token
        } catch (e) {
          cli.log.error(e)
          process.exit(1)
        }

        anvil.discover()

          // prompt for role
          .then(function (configuration) {
            return new Promise(function (resolve, reject) {
              if (data[0]) {
                resolve(data[0])
              } else {
                anvil.roles.list({ token: token })
                  .then(function (roles) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'roleName',
                        message: 'Select a role',
                        choices: roles.map(function (role) {
                          return {
                            name: role.name,
                            value: role.name
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.roleName)
                    })
                  })
                  .catch(reject)
              }
            })
          })

          // get the scopes
          .then(function (role) {
            return anvil.roles.scopes.list(role, { token: token })
          })

          // display the scopes
          .then(function (scopes) {
            var table = new Table({
              head: ['Name', 'Description', 'Restricted']
            })

            scopes.forEach(function (scope) {
              var name = chalk.bold(scope.name)
              var description = scope.description
              var restricted = scope.restricted
              table.push([name, description, restricted])
            })

            cli.log(table.toString())
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * Permit
   */

  roleCmd
    .task('permit')
    .handler(function (data, flags, done) {
      cli.issuers.prompt(flags['issuer'] || flags.i, function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        try {
          var anvil = cli.client.create(issuer)
          var token = anvil.tokens.access_token
        } catch (e) {
          cli.log.error(e)
          process.exit(1)
        }

        anvil.discover()

          // get role and user choices
          .then(function (configuration) {
            return new Promise(function (resolve, reject) {
              // command arguments for user and role
              if (data[0] && data[1]) {
                resolve({
                  roleName: data[0],
                  scopeName: data[1]
                })

              // prompt for user and role
              } else {
                Promise.all([
                  anvil.roles.list({ token: token }),
                  anvil.scopes.list({ token: token })
                ])
                .then(function (data) {
                  var roles = data[0]
                  var scopes = data[1]

                  cli.prompt([
                    {
                      type: 'list',
                      name: 'roleName',
                      message: 'Select a role',
                      choices: roles.map(function (role) {
                        return {
                          name: role.name,
                          value: role.name
                        }
                      })
                    },
                    {
                      type: 'list',
                      name: 'scopeName',
                      message: 'Select a scope to permit',
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

          // try to add the role
          .then(function (data) {
            var role = data.roleName
            var scope = data.scopeName

            return anvil.roles.scopes.add(role, scope, { token: token })
          })

          // display the result
          .then(function (response) {
            if (response.added) {
              console.log('The scope is now permitted')
            }
            done()
          })

          // handle error
          .catch(apiError)
      })
    })

  /**
   * Permit
   */

  roleCmd
    .task('forbid')
    .handler(function (data, flags, done) {
      cli.issuers.prompt(flags['issuer'] || flags.i, function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        try {
          var anvil = cli.client.create(issuer)
          var token = anvil.tokens.access_token
        } catch (e) {
          cli.log.error(e)
          process.exit(1)
        }

        anvil.discover()

          // get role and user choices
          .then(function (configuration) {
            return new Promise(function (resolve, reject) {
              // command arguments for user and role
              if (data[0] && data[1]) {
                resolve({
                  roleName: data[0],
                  scopeName: data[1]
                })

              // prompt for user and role
              } else {
                Promise.all([
                  anvil.roles.list({ token: token }),
                  anvil.scopes.list({ token: token })
                ])
                .then(function (data) {
                  var roles = data[0]
                  var scopes = data[1]

                  cli.prompt([
                    {
                      type: 'list',
                      name: 'roleName',
                      message: 'Select a role',
                      choices: roles.map(function (role) {
                        return {
                          name: role.name,
                          value: role.name
                        }
                      })
                    },
                    {
                      type: 'list',
                      name: 'scopeName',
                      message: 'Select a scope to forbid',
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

          // try to add the role
          .then(function (data) {
            var role = data.roleName
            var scope = data.scopeName

            return anvil.roles.scopes.delete(role, scope, { token: token })
          })

          // display the result
          .then(function (response) {
            console.log('The scope is no longer permitted')
            done()
          })

          // handle error
          .catch(apiError)
      })
    })

  done()
}

/**
 * Exports
 */

module.exports = registerRole
