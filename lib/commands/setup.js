/* global process */

/**
 * Module dependencies
 */

var cwd = process.cwd()
var fs = require('fs')
var url = require('url')
var path = require('path')
var _s = require('underscore.string')
var request = require('request-promise')

/**
 * Login command
 */

function registerSetup (cli, options, done) {
  cli.command('setup')
    .handler(function (data, flags, done) {
      var defaultCACertPath = path.join(
        cwd, 'connect', 'nginx', 'certs', 'nginx.crt'
      )

      var defaultCACertExists = false
      try {
        defaultCACertExists = fs.lstatSync(defaultCACertPath).isFile()
      } catch (e) {}

      cli.prompt([
        {
          type: 'input',
          name: 'issuer',
          message: 'Enter the issuer URI',
          value: function () {
            if (data[0]) { return data[0] }

            var configPath = path.join(cwd, 'connect', 'config', 'development.json')
            try {
              var config = require(configPath)
              return config.issuer
            } catch(e) {
              return undefined
            }
          },
          required: true,
          format: 'url'
        },
        {
          type: 'confirm',
          name: 'selfSignedSSL',
          message: 'Is the SSL certificate self-signed?',
          default: false,
          value: (flags['ca-cert'] || flags.s) ? true : undefined,
          when: function (answers) {
            return answers.issuer.indexOf('https') === 0 && !defaultCACertExists
          }
        },
        {
          type: 'input',
          name: 'caCertPath',
          message: 'Enter the path to the CA SSL certificate',
          value: function () {
            var flag = flags['ca-cert'] || flags.s
            if (flag) { return flag }
            if (defaultCACertExists) { return defaultCACertPath }
            return undefined
          },
          when: function (answers) { return answers.selfSignedSSL }
        },
        {
          type: 'input',
          name: 'setupToken',
          message: 'Enter the path to the setup token',
          value: function () {
            var flag = flags['token-file'] || flags.t
            if (flag) { return flag }

            var tokenPath = path.join(cwd, 'connect', 'keys', 'setup.token')

            try {
              return fs.lstatSync(tokenPath).isFile() ? tokenPath : undefined
            } catch (e) {
              return undefined
            }
          }
        }
      ], function (answers) {
        var setupToken
        var issuerUri = answers.issuer
        var caCertPath = answers.caCertPath
        var setupTokenPath = answers.setupToken

        try {
          var anvil = cli.client.create({
            issuer: issuerUri,
            caCertPath: caCertPath
          })
        } catch (e) {
          cli.log.error(e)
          process.exit(1)
        }

        try {
          setupToken = fs.readFileSync(setupTokenPath).toString()
        } catch (e) {
          cli.log.error('Couldn\'t load the setup token')
          process.exit(1)
        }

        anvil.discover()
          .then(function (configuration) {
            cli.prompt([
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
              cli.prompt([
                {
                  type: 'input',
                  name: 'id',
                  message: 'Choose an ID for this configuration',
                  default: _s.slugify(answers.issuerName),
                  value: flags['id'] || flags.i
                }
              ], function (issId) {
                request({
                  uri: issuerUri + '/setup', // consider adding setup_uri to .well-known/openid-configuration
                  method: 'POST',
                  form: {
                    email: answers.email,
                    password: answers.password,
                    token: setupToken
                  },
                  agentOptions: anvil.agentOptions,
                  json: true
                })
                .then(function (setup) {
                  try {
                    cli.issuers.save({
                      name: answers.issuerName,
                      fileName: issId.id,
                      issuer: issuerUri,
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
          })
          .catch(function () {
            cli.log.error(issuerUri + ' does not point to an Anvil Connect server')
            process.exit(1)
          })
      })
    })
  done()
}

/**
 * Export
 */

module.exports = registerSetup
