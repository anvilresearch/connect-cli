/**
 * Module dependencies
 */

var cwd = process.cwd()
var path = require('path')
var inquirer = require('inquirer')
var AnvilConnect = require('anvil-connect-nodejs/promises')
var config = require(path.join(cwd, 'config.json'))

/**
 * Login command
 */

function registerLogin (cli, options, done) {
  cli.command('login')
    .handler(function (data, flags, done) {
      var anvil = new AnvilConnect(config)

      inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Enter your email'
        },
        {
          type: 'password',
          name: 'password',
          message: 'Enter your password'
        }
      ], function (answers) {

        anvil
          // get the provider configuration
          .discover()

          // get the provider's public keys
          .then(function (configuration) {
            return anvil.jwks()
          })

          // login
          .then(function (jwks) {
            return anvil.login(answers.email, answers.password)
          })

          // get user info
          .then(function (tokens) {
            anvil.tokens = tokens
            return anvil.userInfo()
          })

          // what should we do from here?
          .then(function (userInfo) {
            console.log(userInfo)
            done()
          })

          .catch(function (err) {
            console.log(err, err.stack)
            done()
          })
      })
    })
  done()
}

/**
 * Export
 */

module.exports = registerLogin
