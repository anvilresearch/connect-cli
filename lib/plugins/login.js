/* global Promise */

/**
 * Module dependencies
 */

var url = require('url')
var qs = require('qs')
var request = require('request-promise')
var AnvilConnect = require('anvil-connect-nodejs')

/**
 * Add login command to Anvil Connect Node.js client
 */

function extendLogin (cli, options, done) {
  // add login method to anvil client
  function login (credentials, issuer) {
    var self = this
    var input = {}

    // construct the endpoint
    // this one isn't included in openid-configuration
    var uri = this.issuer + '/signin'

    // authorization parameters
    var params = this.authorizationParams(input)

    // password login params
    if (!issuer.fields) {
      params.provider = 'password'
      params.email = credentials.email
      params.password = credentials.password
      params.scope = 'openid profile realm'

    // alternate provider login params
    } else {
      params.provider = issuer.provider
      issuer.fields.forEach(field => {
        params[field.name] = credentials[field.name]
      })
      params.scope = 'openid profile realm'
    }

    // authorization request
    return new Promise(function (resolve, reject) {
      request({
        url: uri,
        method: 'POST',
        form: params,
        headers: { 'referer': uri },
        agentOptions: self.agentOptions
      })
      // If the server returns a 200 OK, then the server has responded that
      // either:
      //
      //  - Bad username & password
      //  - Other error related to sign-in
      //
      // Because the server does not return the error in a machine-friendly
      // format (e.g. JSON) we just assume it is a bad username and password
      //
      // TODO: Consider implementing Resource Owner Password Credentials
      .then(function (data) {
        reject(new Error('Bad username or password'))
      })
      // this is so ugly, but redirects get treated as errors by HTTP clients.
      // So we need to handle the expected result using `catch`. Ugh.
      .catch(function (err) {
        if (err.statusCode === 302) {
          var u = url.parse(err.response.headers.location)
          var code = qs.parse(u.query).code

          // we need to handle an error response in redirect

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

  done()
}

/**
 * Exports
 */

module.exports = extendLogin
