/* global process */

/**
 * Module dependencies
 */

var Table = require('cli-table')
var _s = require('underscore.string')

/**
 * Issuer command
 */

function registerIssuer (cli, options, done) {
  var issuerCmd = cli.command('issuer')

  issuerCmd
    .handler(function (data, flags, done) {
      cli.log('Usage:')
      cli.log('  nvl issuer:list')
      cli.log(
        '  nvl issuer:add ' +
        '[<issuer uri>] ' +
        '[--client-id | -c <id>]\n\t' +
        '[--client-secret | -s <secret>] ' +
        '[--redirect-uri | -r <uri>]\n\t' +
        '[--name | -n <config name>] ' +
        '[--id | -i <config id>]'
      )
      cli.log(
        '  nvl issuer:edit ' +
        '[<config id>] ' +
        '[--issuer-uri | -u <uri>]\n\t' +
        '[--client-id | -c <id>] ' +
        '[--client-secret | -s <secret>]\n\t' +
        '[--redirect-uri | -r <uri>] ' +
        '[--name | -n <config name>]\n\t' +
        '[--id | -i <config id>]'
      )
      cli.log('  nvl issuer:info [<config id>]')
      cli.log('  nvl issuer:del [<config id>]')
      cli.log(
        '  nvl issuer:default ' +
        '[--clear | -c] ' +
        '[--set | -s <config id>]'
      )
    })

  issuerCmd.task('add')
    .handler(function (data, flags, done) {
      cli.prompt([
        {
          type: 'input',
          name: 'issuer',
          message: 'Enter the issuer URI',
          value: data[0],
          required: true,
          format: 'url'
        },
        {
          type: 'confirm',
          name: 'selfSignedSSL',
          message: 'Is the SSL certificate self-signed?',
          default: false,
          value: (flags['ca-cert'] || flags.t) ? true : undefined,
          when: function (answers) {
            return answers.issuer.indexOf('https') === 0
          }
        },
        {
          type: 'input',
          name: 'caCertPath',
          message: 'Enter the path to the CA SSL certificate',
          value: flags['ca-cert'] || flags.t,
          when: function (answers) { return answers.selfSignedSSL }
        }
      ], function (answers) {
        var issuerUri = answers.issuer
        var caCertPath = answers.caCertPath

        try {
          var anvil = cli.client.create({
            issuer: issuerUri,
            caCertPath: caCertPath
          })
        } catch (e) {
          cli.log.error(e)
          process.exit(1)
        }

        function getDetailsAndSave () {
          cli.prompt([
            {
              type: 'input',
              name: 'client_id',
              message: 'Enter the client ID',
              value: flags['client-id'] || flags.c,
              required: true
            },
            {
              type: 'input',
              name: 'client_secret',
              message: 'Enter the client secret',
              value: flags['client-secret'] || flags.s,
              required: true
            },
            {
              type: 'input',
              name: 'redirect_uri',
              message: 'Enter the redirect URI',
              value: flags['redirect-uri'] || flags.r,
              required: true,
              format: 'url'
            },
            {
              type: 'input',
              name: 'name',
              message: 'Choose a name for this configuration',
              value: flags['name'] || flags.n,
              required: true
            }
          ], function (answers) {
            cli.prompt([
              {
                type: 'input',
                name: 'id',
                message: 'Choose an ID for this configuration',
                default: _s.slugify(answers.name),
                value: flags['id'] || flags.i,
                filter: function (input) {
                  return input && _s.slugify(input)
                },
                required: true
              }
            ], function (issId) {
              try {
                cli.issuers.save({
                  name: answers.name,
                  fileName: issId.id,
                  issuer: issuerUri,
                  client_id: answers.client_id,
                  client_secret: answers.client_secret,
                  redirect_uri: answers.redirect_uri,
                  caCertPath: caCertPath
                })
              } catch (e) {
                cli.log.error('Couldn\'t write configuration file')
                process.exit(1)
              }

              cli.log('Added issuer. You may now log in with `$ nvl login`.')
              done()
            })
          })
        }

        if (flags['force'] || flags.f) {
          getDetailsAndSave()
        } else {
          anvil.discover().then(getDetailsAndSave).catch(function () {
            cli.log.error(answers.issuer + ' does not point to an Anvil Connect server')
            process.exit(1)
          })
        }
      })
    })

  issuerCmd.task('edit')
    .handler(function (data, flags, done) {
      cli.issuers.prompt({
        useDefault: false,
        choice: data[0]
      }, function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        cli.prompt([
          {
            type: 'input',
            name: 'issuer',
            message: 'Enter the issuer URI',
            default: issuer.issuer,
            value: flags['issuer-uri'] || flags.u
          },
          {
            type: 'confirm',
            name: 'selfSignedSSL',
            message: 'Is the SSL certificate self-signed?',
            default: false,
            value: (issuer.caCertPath || flags['ca-cert'] || flags.t)
              ? true : undefined,
            when: function (answers) { return answers.issuer.indexOf('https') === 0 }
          },
          {
            type: 'input',
            name: 'caCertPath',
            message: 'Enter the path to the CA SSL certificate',
            default: issuer.caCertPath,
            value: flags['ca-cert'] || flags.t,
            when: function (answers) { return answers.selfSignedSSL }
          }
        ], function (answers) {
          var issuerUri = answers.issuer
          var caCertPath = answers.caCertPath

          try {
            var anvil = cli.client.create({
              issuer: issuerUri,
              caCertPath: caCertPath
            })
          } catch (e) {
            cli.log.error(e)
            process.exit(1)
          }

          function getDetailsAndSave () {
            cli.prompt([
              {
                type: 'input',
                name: 'client_id',
                message: 'Enter the client ID',
                default: issuer.client_id,
                value: flags['client-id'] || flags.c,
                required: true
              },
              {
                type: 'input',
                name: 'client_secret',
                message: 'Enter the client secret',
                default: issuer.client_secret,
                value: flags['client-secret'] || flags.s,
                required: true
              },
              {
                type: 'input',
                name: 'redirect_uri',
                message: 'Enter the redirect URI',
                default: issuer.redirect_uri,
                value: flags['redirect-uri'] || flags.r,
                required: true,
                format: 'url'
              },
              {
                type: 'input',
                name: 'name',
                message: 'Choose a name for this configuration',
                default: issuer.name,
                value: flags['name'] || flags.n,
                required: true
              },
              {
                type: 'input',
                name: 'id',
                message: 'Choose an ID for this configuration',
                default: issuer.fileName,
                value: flags['id'] || flags.i,
                required: true
              }
            ], function (answers) {
              try {
                cli.issuers.save({
                  name: answers.name,
                  fileName: answers.id,
                  issuer: issuerUri,
                  client_id: answers.client_id,
                  client_secret: answers.client_secret,
                  redirect_uri: answers.redirect_uri,
                  caCertPath: caCertPath
                })
                if (issuer.fileName !== answers.id) {
                  cli.issuers.del(issuer.fileName)
                }
              } catch (e) {
                cli.log.error('Couldn\'t write configuration file')
                process.exit(1)
              }

              cli.log('Updated issuer configuration.')
              done()
            })
          }

          if (flags['force'] || flags.f) {
            getDetailsAndSave()
          } else {
            anvil.discover().then(getDetailsAndSave).catch(function () {
              cli.log.error(answers.issuer + ' does not point to an Anvil Connect server')
              process.exit(1)
            })
          }

        })
      })
    })

  issuerCmd.task('del')
    .handler(function (data, flags, done) {
      cli.issuers.prompt({
        useDefault: false,
        choice: data[0]
      }, function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        cli.issuers.del(issuer)

        cli.log('Deleted issuer.')
      })
    })

  issuerCmd.task('list')
    .handler(function (data, flags, done) {
      var table = new Table({
        head: ['Issuer ID', 'Name', 'Address']
      })

      cli.issuers.list().forEach(function (issuer) {
        table.push([issuer.fileName, issuer.name, issuer.issuer])
      })

      cli.log(table.toString())

      done()
    })

  issuerCmd.task('default')
    .flag('--clear')
    .name('-c')
    .handler(function (value, done) {
      delete cli.config.data.defaultIssuer

      try {
        cli.config.save()
      } catch (e) {
        cli.log.error(e)
        process.exit(1)
      }

      cli.log('Cleared default issuer.')

      done()
    })

  issuerCmd.task('default')
    .flag('--set')
    .name('-s')
    .handler(function (value, done) {
      cli.issuers.prompt({
        alwaysPrompt: true,
        useDefault: false,
        choice: value
      }, function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        cli.config.data.defaultIssuer = issuer.fileName

        try {
          cli.config.save()
        } catch (e) {
          cli.log.error(e)
          process.exit(1)
        }

        cli.log('Saved default issuer.')

        done()
      })
    })

  issuerCmd.task('default')
    .handler(function (data, flags, done) {
      if (cli.config.data.defaultIssuer) {
        var issuer = cli.issuers.load()

        cli.log('Default issuer:')
        cli.log('Name:\t' + issuer.name)
        cli.log('ID:\t' + issuer.fileName)
        cli.log('URI:\t' + issuer.issuer)
      } else {
        cli.log('No default issuer set.')
      }

      done()
    })

  issuerCmd.task('info')
    .handler(function (data, flags, done) {
      cli.issuers.prompt({
        alwaysPrompt: true,
        useDefault: false,
        quiet: true,
        choice: data[0]
      }, function (err, issuer) {
        if (err) {
          cli.log.error(err)
          process.exit(1)
        }

        cli.log('Issuer name:\t' + issuer.name)
        cli.log('ID:\t\t' + issuer.fileName)
        cli.log('URI:\t\t' + issuer.issuer)
        cli.log('Client ID:\t' + issuer.client_id)
        cli.log('Client secret:\t' + issuer.client_secret)
        issuer.caCertPath && cli.log('CA SSL Cert:\t' + issuer.caCertPath)

        done()
      })
    })

  done()
}

/**
 * Export
 */

module.exports = registerIssuer
