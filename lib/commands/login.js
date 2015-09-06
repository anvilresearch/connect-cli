/**
 * Module dependencies
 */

var cwd = process.cwd()
var fs = require('fs')
var qs = require('qs')
var url = require('url')
var path = require('path')
var inquirer = require('inquirer')
var request = require('request-promise')
var AnvilConnect = require('anvil-connect-nodejs/promises')
var IDToken = require('anvil-connect-nodejs/lib/IDToken')
var AccessToken = require('anvil-connect-nodejs/lib/AccessToken')


/**
 * Load client configuration
 */

var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
try {
  var config = require(path.join(home, '.nvl', 'config.json'))
} catch (e) {
  console.log(e)
  process.exit(1)
}

/**
 * Login command
 */

function registerLogin (cli, options, done) {
  cli.command('login')
    .handler(function (data, flags, done) {
      var anvil = new AnvilConnect(config)

      /**
       * Login
       */

      function login (email, password) {
        var self = this

        // construct the endpoint
        // this one isn't included in openid-configuration
        var uri = this.issuer + '/signin'

        // authorization parameters
        var params = this.authorizationParams({
          provider: 'password',
          email: email,
          password: password
        })

        return new Promise(function (resolve, reject) {
          request({
            url: uri,
            method: 'POST',
            form: params,
            headers: { 'referer': uri }
          })
          // this is so ugly, but redirects get treated as errors by HTTP clients.
          // So we need to handle the expected result using `catch`. Ugh.
          .catch(function (err) {
            if (err.statusCode === 302) {
              var u = url.parse(err.response.headers.location)
              var code = qs.parse(u.query).code

              self.token({ code: code })
              .then(function (data) {
                resolve(data)
              })
              .catch(function (err) {
                reject(err)
              })
            } else {
              reject(err)
            }
          })
        })
      }

      AnvilConnect.prototype.login = login


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

          // store the tokens
          .then(function (tokens) {
            var filepath = path.join(home, '.nvl', 'tokens.json')
            fs.writeFile(filepath, JSON.stringify(tokens, null, 2), function (err) {
              console.log(tokens)
              done()
            })
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