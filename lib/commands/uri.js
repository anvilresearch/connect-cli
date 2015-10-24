/**
 * Module Dependencies
 */
var crypto = require('crypto')
var inquirer = require('inquirer')

/**
 * Uri Command
 */

function registerUri (cli, options, done) {
  cli.command('uri')
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

        function longPrompt () {
          return flags.l || flags.long
        }

        anvil.discover()
          .then(function (configuration) {
            inquirer.prompt([
              {
                type: 'input',
                name: 'endpoint',
                message: 'Enter your Endpoint',
                default: 'authorize'
              },
              {
                type: 'list',
                name: 'response_type',
                message: 'Choose your response type',
                choices: [
                  'code',
                  'code token',
                  'code id_token',
                  'id_token',
                  'id_token token',
                  'code id_token token',
                  'none'
                ],
                when: longPrompt
              },
              {
                type: 'input',
                name: 'redirect_uri',
                message: 'Enter redirect uri',
                default: anvil.redirect_uri,
                when: longPrompt
              },
              {
                type: 'input',
                name: 'scope',
                message: 'Enter scope',
                default: anvil.scope,
                when: longPrompt
              },
              {
                type: 'input',
                name: 'state',
                message: 'Enter state',
                default: function () {
                  return crypto.randomBytes(10).toString('hex')
                },
                when: longPrompt
              },
              {
                type: 'input',
                name: 'nonce',
                message: 'Enter nonce',
                default: function () {
                  return crypto.randomBytes(10).toString('hex')
                },
                when: longPrompt
              },
              {
                type: 'list',
                name: 'response_mode',
                message: 'Choose your response mode',
                choices: ['fragment', 'query'],
                when: longPrompt
              },
              {
                type: 'list',
                name: 'display',
                message: 'Choose your display',
                choices: ['page', 'popup', 'touch', 'wap'],
                when: longPrompt
              },
              {
                type: 'list',
                name: 'prompt',
                message: 'Choose prompt',
                choices: ['', 'none', 'login', 'consent', 'select_account'],
                when: longPrompt
              },
              {
                type: 'input',
                name: 'max_age',
                message: 'Enter max age in seconds',
                default: 3600,
                when: longPrompt
              }
            ], function (answers) {
              var uri = anvil.authorizationUri(answers)
              console.log(uri)
              done()
            })
          })
          .catch(function (error) {
            console.log(error)
          })
      })
    })
  done()
}

/**
 * Export
 */

module.exports = registerUri
