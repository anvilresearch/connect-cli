/* global process, Promise */

/**
 * Module dependencies
 */

var fs = require('fs')
var qs = require('qs')
var url = require('url')
var path = require('path')
var inquirer = require('inquirer')
var request = require('request-promise')
var AnvilConnect = require('anvil-connect-nodejs')
var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']

/**
 * Load client configuration
 */

function loadConfig(cli) {
  var config
  try {
    config = require(path.join(home, '.nvl', 'config.json'))
  } catch (e) {
    cli.log.error(e)
    process.exit(1)
  }
  return config
}

/**
 * Login command
 */

function registerLogin (cli, options, done) {
  cli.command('login')
    .handler(function (data, flags, done) {
      var config = loadConfig(cli)
      var anvil = new AnvilConnect(config)

      // prompt for email and password
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
            return anvil.getJWKs()
          })

          // login
          .then(function (jwks) {
            return anvil.login(answers.email, answers.password)
          })

          // store the tokens
          .then(function (tokens) {
            var filepath = path.join(home, '.nvl', 'tokens.json')
            fs.writeFile(filepath, JSON.stringify(tokens, null, 2), function (err) {
              if (err) {
                cli.log.error(err)
                process.exit(1)
              }

              cli.log('You have been successfully logged in to ' + config.issuer)
              done()
            })
          })

          .catch(function (err) {
            cli.log.error(err)
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
