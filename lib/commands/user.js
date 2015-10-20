/* global process, Promise */

/**
 * Module dependencies
 */

var chalk = require('chalk')

/**
 * User commands
 */

function registerUser (cli, options, done) {
  var userCmd = cli.command('user')

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
  userCmd
    .handler(function (data, flags, done) {
      cli.log('Usage:')
      cli.log(
        '  nvl user:register [--issuer | -i <issuer id>]\n\t' +
        '[--name | -n <name>] [--given | -g <given name>]\n\t' +
        '[--middle | -m <middle name>] [--family | -f <family name>]\n\t' +
        '[--nickname | -k <nickname>] [--username | -u <preferred username>]\n\t' +
        '[--profile | -p <profile url>] [--picture | -i <picture url>]\n\t' +
        '[--website | -w <website url>] [--email | -e <email>]'
      )

      cli.log('  nvl user:list [--issuer | -i <issuer id>]')

      cli.log('  nvl user:info [<id>] [--issuer | -i <issuer id>]')

      cli.log(
        '  nvl user:update [<id>] [--issuer | -i <issuer id>]\n\t' +
        '[--name | -n <name>] [--given | -g <given name>]\n\t' +
        '[--middle | -m <middle name>] [--family | -f <family name>]\n\t' +
        '[--nickname | -k <nickname>] [--username | -u <preferred username>]\n\t' +
        '[--profile | -p <profile url>] [--picture | -i <picture url>]\n\t' +
        '[--website | -w <website url>] [--email | -e <email>]'
      )

      cli.log('  nvl user:delete [<id>] [--issuer | -i <issuer id>]')

      done()
    })

  /**
   * User registration
   */

  userCmd
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
                name: 'givenName',
                message: 'Given name',
                value: flags['given'] || flags.g,
                trim: true
              },
              {
                type: 'input',
                name: 'middleName',
                message: 'Middle name',
                value: flags['middle'] || flags.m,
                trim: true
              },
              {
                type: 'input',
                name: 'familyName',
                message: 'Family name',
                value: flags['family'] || flags.f,
                trim: true
              },
              {
                type: 'input',
                name: 'nickname',
                message: 'nickname',
                value: flags['nickname'] || flags.k,
                trim: true
              },
              {
                type: 'input',
                name: 'preferredUsername',
                message: 'Preferred username',
                value: flags['username'] || flags.u,
                trim: true
              },
              {
                type: 'input',
                name: 'profile',
                message: 'Profile URI',
                value: flags['profile'] || flags.p,
                format: 'url',
                trim: true
              },
              {
                type: 'input',
                name: 'picture',
                message: 'Picture URI',
                value: flags['picture'] || flags.i,
                format: 'url',
                trim: true
              },
              {
                type: 'input',
                name: 'website',
                message: 'Website',
                value: flags['website'] || flags.w,
                format: 'url',
                trim: true
              },
              {
                type: 'input',
                name: 'email',
                message: 'Email',
                value: flags['email'] || flags.e,
                trim: true
              },
              {
                type: 'password',
                name: 'password',
                message: 'Password'
              }
            ], function (answers) {
              // register the user
              anvil.users.create(answers, { token: anvil.tokens.access_token })
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
   * User list
   */

  userCmd
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
            return anvil.users.list({ token: anvil.tokens.access_token })
          })
          .then(function (users) {
            users.forEach(function (user) {
              cli.log.json({
                'name': user.name || user.givenName + ' ' + user.familyName,
                '_id': user._id,
                'email': user.email
              })
            })
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * User info
   */

  userCmd
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
                anvil.users.list({ token: anvil.tokens.access_token })
                  .then(function (users) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'userId',
                        message: 'Select a user',
                        choices: users.map(function (user) {
                          return {
                            name: (user.name || user.givenName + ' ' + user.familyName) + ' – ' + chalk.yellow(user._id),
                            value: user._id
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.userId)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (userId) {
            return anvil.users.get(userId, { token: anvil.tokens.access_token })
          })
          .then(function (data) {
            cli.log.json(data)
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * User update
   */

  userCmd
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
                anvil.users.list({ token: anvil.tokens.access_token })
                  .then(function (users) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'userId',
                        message: 'Select a user',
                        choices: users.map(function (user) {
                          return {
                            name: user.name + ' – ' + chalk.yellow(user._id),
                            value: user._id
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.userId)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (userId) {
            return anvil.users.get(userId, { token: anvil.tokens.access_token })
          })
          .then(function (user) {
            return new Promise(function (resolve, reject) {
              cli.prompt([
                {
                  type: 'input',
                  name: 'name',
                  message: 'Name',
                  value: flags['name'] || flags.n,
                  default: user.name,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'givenName',
                  message: 'Given name',
                  value: flags['given'] || flags.g,
                  default: user.givenName,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'middleName',
                  message: 'Middle name',
                  value: flags['middle'] || flags.m,
                  default: user.middleName,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'familyName',
                  message: 'Family name',
                  value: flags['family'] || flags.f,
                  default: user.familyName,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'nickname',
                  message: 'nickname',
                  value: flags['nickname'] || flags.k,
                  default: user.nickname,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'preferredUsername',
                  message: 'Preferred username',
                  value: flags['username'] || flags.u,
                  default: user.preferredUsername,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'profile',
                  message: 'Profile URI',
                  value: flags['profile'] || flags.p,
                  format: 'url',
                  default: user.profile,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'picture',
                  message: 'Picture URI',
                  value: flags['picture'] || flags.i,
                  format: 'url',
                  default: user.picture,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'website',
                  message: 'Website',
                  value: flags['website'] || flags.w,
                  format: 'url',
                  default: user.website,
                  trim: true
                },
                {
                  type: 'input',
                  name: 'email',
                  message: 'Email',
                  value: flags['email'] || flags.e,
                  default: user.email,
                  trim: true
                }
              ], function (update) {
                resolve({
                  user: user,
                  update: update
                })
              })
            })
          })
          .then(function (data) {
            return anvil.users.update(data.user._id, data.update, { token: anvil.tokens.access_token })
          })
          .then(function (data) {
            cli.log.json(data)
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * User delete
   */

  userCmd
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
                anvil.users.list({ token: anvil.tokens.access_token })
                  .then(function (users) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'userId',
                        message: 'Select a user',
                        choices: users.map(function (user) {
                          return {
                            name: user.name + ' – ' + chalk.yellow(user._id),
                            value: user._id
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.userId)
                    })
                  })
                  .catch(reject)
              }
            })
          })
          .then(function (userId) {
            // Forbid deletion of the current user
            if (issuer.session.tokens.id_claims.sub === userId) {
              throw new Error('Deleting yourself is forbidden.')
            }

            return anvil.users.delete(userId, { token: anvil.tokens.access_token })
          })
          .then(function () {
            done()
          })
          .catch(apiError)
      })
    })

  /**
   * List roles
   */

  userCmd
    .task('roles')
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

          // prompt for user
          .then(function (configuration) {
            return new Promise(function (resolve, reject) {
              if (data[0]) {
                resolve(data[0])
              } else {
                anvil.users.list({ token: anvil.tokens.access_token })
                  .then(function (users) {
                    cli.prompt([
                      {
                        type: 'list',
                        name: 'userId',
                        message: 'Select a user',
                        choices: users.map(function (user) {
                          return {
                            name: user.name + ' – ' + chalk.yellow(user._id),
                            value: user._id
                          }
                        })
                      }
                    ], function (answers) {
                      resolve(answers.userId)
                    })
                  })
                  .catch(reject)
              }
            })
          })

          // retrieve the roles for this user
          .then(function (userId) {
            return anvil.users.roles.list(userId, { token: token })
          })

          // display the roles
          .then(function (roles) {
            var roleList = []
            roles.forEach(function (role) {
              roleList.push(role.name)
            })
            cli.log.json(roleList)
            done()
          })

          // handle error
          .catch(apiError)
      })
    })

  /**
   * Assign role
   */

  userCmd
    .task('assign')
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
                  userId: data[0],
                  roleName: data[1]
                })

              // prompt for user and role
              } else {
                Promise.all([
                  anvil.users.list({ token: token }),
                  anvil.roles.list({ token: token })
                ])
                .then(function (data) {
                  var users = data[0]
                  var roles = data[1]

                  cli.prompt([
                    {
                      type: 'list',
                      name: 'userId',
                      message: 'Select a user',
                      choices: users.map(function (user) {
                        var name

                        if (user.name) {
                          name = user.name
                        } else if (user.givenName && user.familyName) {
                          name = user.givenName + ' ' + user.familyName
                        } else {
                          name = ''
                        }

                        return {
                          name: name + ' – ' + chalk.yellow(user._id),
                          value: user._id
                        }
                      })
                    },
                    {
                      type: 'list',
                      name: 'roleName',
                      message: 'Select a role to assign',
                      choices: roles.map(function (role) {
                        return {
                          name: role.name,
                          value: role.name
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
            var user = data.userId
            var role = data.roleName

            return anvil.users.roles.add(user, role, { token: token })
          })

          // display the result
          .then(function (response) {
            if (response.added) {
              console.log('The role was added')
            }
            done()
          })

          // handle error
          .catch(apiError)
      })
    })

  /**
   * Revoke role
   */

  userCmd
    .task('revoke')
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
                  userId: data[0],
                  roleName: data[1]
                })

              // prompt for user and role
              } else {
                Promise.all([
                  anvil.users.list({ token: token }),
                  anvil.roles.list({ token: token })
                ])
                .then(function (data) {
                  var users = data[0]
                  var roles = data[1]

                  cli.prompt([
                    {
                      type: 'list',
                      name: 'userId',
                      message: 'Select a user',
                      choices: users.map(function (user) {
                        var name

                        if (user.name) {
                          name = user.name
                        } else if (user.givenName && user.familyName) {
                          name = user.givenName + ' ' + user.familyName
                        } else {
                          name = ''
                        }

                        return {
                          name: name + ' – ' + chalk.yellow(user._id),
                          value: user._id
                        }
                      })
                    },
                    {
                      type: 'list',
                      name: 'roleName',
                      message: 'Select a role to assign',
                      choices: roles.map(function (role) {
                        return {
                          name: role.name,
                          value: role.name
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
            var user = data.userId
            var role = data.roleName

            return anvil.users.roles.delete(user, role, { token: token })
          })

          // display the result
          .then(function (response) {
            console.log('The role was removed')
            done()
          })

          // handle error
          .catch(apiError)
      })
    })

  /**
   * Voila!
   */

  done()
}

/**
 * Exports
 */

module.exports = registerUser
