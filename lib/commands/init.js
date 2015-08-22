/**
 * Module dependencies
 */

var path = require('path')
var dns = require('native-dns')
var mkdirp = require('mkdirp')
var crypto = require('crypto')
var _s = require('underscore.string')

/**
 * DEPRECATED
 *
 * Initialize Directory
 *
 * If the directory exists and is not empty, this will prompt
 * to continue. If the directory does not exist, it will be
 * created and the process cwd changed.
 */

/*
function directory (context) {
  return function (done) {
    var log = context.cli.log,
      dir = path.join(process.cwd(), context.dir)

    // if it's an existing directory
    if (fs.existsSync(dir)) {
      // and it's not empty
      if (fs.readdirSync(dir).length > 0) {
        // prompt to confirm
        inquirer.prompt([
          {
            type: 'confirm',
            name: 'existing',
            message: 'This is not an empty directory. Are you sure you want to proceed?',
            default: false
          }
        ], function (answers) {
          if (answers.existing) {
            process.chdir(dir)
            log.br()
            done()
          } else {
            log.br()
            log.error('ABORTED')
            process.exit()
          }
        })
      }

      // otherwise continue
      else {
        done()
      }
    } else {
      mkdirp(dir, function (err) {
        if (err) { return done(err); }
        process.chdir(dir)
        done()
      })
    }
  }
}
*/

/**
 * Register command
 */

function registerInit (cli, options, done) {
  cli.command('init')
    .handler(function (data, flags, done) {
      /**
       * Command dependencies
       */

      var request = require('request')
      var yeoman = require('yeoman-environment')
      var generators = require('yeoman-generator')
      var env = yeoman.createEnv()
      var log = cli.log

      /**
       * File and template  paths
       */

      var templates = path.join(__dirname, '..', '..', 'templates')

      /**
       * Generator
       */

      var Generator = generators.Base.extend({
        constructor: function () {
          generators.Base.apply(this, arguments)

          // arguments
          // this.argument('appname', { type: String, required: true })

          // options

        // destination
        // this.destinationRoot(?)
        }
      })

      /**
       * Get Latest Anvil Connect Version
       */

      Generator.prototype.packageVersion = function () {
        var callback = this.async()

        request({
          url: 'https://registry.npmjs.org/anvil-connect',
          json: true
        }, function (err, res, body) {
          if (err) { return callback(err) }
          this.version = body['dist-tags'].latest
          callback()
        }.bind(this))
      }

      /**
       * Get default hostname (current computer's FQDN)
       */

      function execDNSQuery (server, question, callback) {
        var req = dns.Request({
          server: server,
          question: dns.Question(question)
        })

        req.on('timeout', function () {
          callback(new Error('Request timed out.'))
        })

        req.on('message', function (err, res) {
          if (err) { return callback(err) }

          callback(null, res.answer)
        })

        req.send()
      }

      Generator.prototype.getDefaultHostname = function () {
        var callback = this.async()

        this.issuer = 'connect.example.com' // Default in case request fails

        execDNSQuery({
          address: '208.67.222.222', // OpenDNS
          port: 53,
          type: 'udp'
        }, {
          name: 'myip.opendns.com',
          type: 'A'
        }, function (err, ans) {
          if (err) { return callback() }

          var ip = ans[0] && ans[0].address

          if (!ip) { return callback() }

          dns.reverse(ip, function (err, results) {
            if (err) { return callback() }
            if (!results[0]) { return callback() }

            this.issuer = results[0]
            callback()
          }.bind(this))
        }.bind(this))
      }

      /**
       * Ask for instance name
       */

      Generator.prototype.askForAppName = function () {
        var callback = this.async()

        var appname = path.basename(process.cwd())

        this.prompt([{
          type: 'input',
          name: 'appname',
          message: 'What would you like to name your Connect instance?',
          default: _s.slugify(_s.humanize(appname))
        }], function (answers) {
          this.appname = _s.slugify(_s.humanize(answers.appname))
          callback()
        }.bind(this))
      }

      /**
       * Ask for issuer
       */

      Generator.prototype.askForIssuer = function () {
        var callback = this.async()

        this.prompt([{
          type: 'input',
          name: 'issuer',
          message: 'What (sub)domain will you use?',
          default: this.issuer
        }], function (answers) {
          this.issuer = answers.issuer
          callback()
        }.bind(this))
      }

      /**
       * Ask for Docker
       */

      Generator.prototype.askForDocker = function () {
        var callback = this.async()

        this.prompt([{
          type: 'confirm',
          name: 'docker',
          message: 'Would you like to use Docker?',
          default: true
        }], function (answers) {
          this.docker = answers.docker
          callback()
        }.bind(this))
      }

      /**
       * Ask for Redis
       */

      Generator.prototype.askForRedis = function () {
        var callback = this.async()

        this.prompt([{
          type: 'confirm',
          name: 'redis',
          message: 'Would you like to run Redis?',
          default: true
        }], function (answers) {
          this.redis = answers.redis
          callback()
        }.bind(this))
      }

      /**
       * Ask for nginx
       */

      Generator.prototype.askForNginx = function () {
        var callback = this.async()

        this.prompt([{
          type: 'confirm',
          name: 'nginx',
          message: 'Would you like to run nginx?',
          default: true
        }], function (answers) {
          this.nginx = answers.nginx
          callback()
        }.bind(this))
      }

      /**
       * Ask for SSL
       */

      Generator.prototype.askForSSL = function () {
        if (this.nginx) {
          var callback = this.async()

          this.prompt([{
            type: 'confirm',
            name: 'ssl',
            message: 'Would you like to create a self-signed SSL cert?',
            default: true
          }], function (answers) {
            this.ssl = answers.ssl
            callback()
          }.bind(this))
        }
      }

      /**
       * Ask for SSL certificate params
       */

      Generator.prototype.askForSSLParams = function () {
        if (this.ssl) {
          var callback = this.async()

          this.prompt([

            // Country Name (2 letter code) [AU]:
            {
              type: 'input',
              name: 'C',
              message: 'Country Name (2 letter code)',
              default: 'US'
            },

            // State or Province Name (full name) [Some-State]:
            {
              type: 'input',
              name: 'ST',
              message: 'State or Province Name (full name)',
              default: 'South Dakota'
            },

            // Locality Name (eg, city) []:
            {
              type: 'input',
              name: 'L',
              message: 'Locality Name (eg, city)',
              default: 'Rapid City'
            },

            // Organization Name (eg, company) [Internet Widgits Pty Ltd]:
            {
              type: 'input',
              name: 'O',
              message: 'Organization Name (eg, company)',
              default: 'Internet Widgits Pty Ltd'
            }

            // Common Name (e.g. server FQDN or YOUR name)
            // Use this.issuer

          ], function (answers) {
            this.C = answers.C
            this.ST = answers.ST
            this.L = answers.L
            this.O = answers.O
            this.CN = this.issuer

            callback()
          }.bind(this))
        }
      }

      /**
       * Git init
       */

      Generator.prototype.gitInit = function () {
        this.spawnCommand('git', ['init'])
      }

      /**
       * .gitignore
       */

      Generator.prototype.gitignore = function () {
        this.copy(
          path.join(templates, '_gitignore'),
          this.destinationPath('.gitignore')
        )
      }

      /**
       * README
       */

      Generator.prototype.readme = function () {
        if (this.docker) {
          this.template(
            path.join(templates, 'README.md'),
            this.destinationPath('README.md')
          )
        }
      }
      /**
       * Docker Compose
       */

      Generator.prototype.dc = function () {
        if (this.docker) {
          this.template(
            path.join(templates, 'docker-compose.yml'),
            this.destinationPath('docker-compose.yml')
          )
        }
      }

      /**
       * Connect
       */

      Generator.prototype.connect = function () {
        // server.js
        this.template(
          path.join(templates, 'connect', 'server.js'),
          this.destinationPath(path.join('connect', 'server.js'))
        )

        // development config file
        if (!this.docker) {
          this.cookie_secret = crypto.randomBytes(10).toString('hex')
          this.session_secret = crypto.randomBytes(10).toString('hex')

          this.template(
            path.join(templates, 'connect', 'config', 'development.json'),
            this.destinationPath(path.join('connect', 'config', 'development.json'))
          )
        }

        // production config file
        this.cookie_secret = crypto.randomBytes(10).toString('hex')
        this.session_secret = crypto.randomBytes(10).toString('hex')

        this.template(
          path.join(templates, 'connect', 'config', 'production.json'),
          this.destinationPath(path.join('connect', 'config', 'production.json'))
        )

        // package.json
        this.template(
          path.join(templates, 'connect', 'package.json'),
          this.destinationPath(path.join('connect', 'package.json'))
        )

        // .bowerrc
        this.template(
          path.join(templates, 'connect', '_bowerrc'),
          this.destinationPath(path.join('connect', '.bowerrc'))
        )

        // bower.json
        this.template(
          path.join(templates, 'connect', 'bower.json'),
          this.destinationPath(path.join('connect', 'bower.json'))
        )

        // Dockerfile
        if (this.docker) {
          this.template(
            path.join(templates, 'connect', 'Dockerfile'),
            this.destinationPath(path.join('connect', 'Dockerfile'))
          )
        }
      }

      /**
       * nginx
       */

      Generator.prototype.nginx = function () {
        if (this.nginx) {
          // main conf
          this.template(
            path.join(templates, 'nginx', 'nginx.conf'),
            this.destinationPath(path.join('nginx', 'nginx.conf'))
          )

          // virtual host
          this.template(
            path.join(templates, 'nginx', 'conf.d', 'default.conf'),
            this.destinationPath(path.join('nginx', 'conf.d', 'default.conf'))
          )

          // upstream entries
          this.template(
            path.join(templates, 'nginx', 'conf.d', 'upstream.conf'),
            this.destinationPath(path.join('nginx', 'conf.d', 'upstream.conf'))
          )

          // Dockerfile
          if (this.docker) {
            this.template(
              path.join(templates, 'nginx', 'Dockerfile'),
              this.destinationPath(path.join('nginx', 'Dockerfile'))
            )
          }
        }
      }

      /**
       * Redis
       */

      Generator.prototype.redis = function () {
        if (this.redis) {
          // redis config
          this.template(
            path.join(templates, 'redis', 'etc', 'redis.conf'),
            this.destinationPath('redis', 'etc', 'redis.conf')
          )

          // Dockerfile
          if (this.docker) {
            this.template(
              path.join(templates, 'redis', 'Dockerfile'),
              this.destinationPath(path.join('redis', 'Dockerfile'))
            )
          }
        }
      }

      /**
       * Keys directory
       */

      Generator.prototype.makeKeysDirectory = function () {
        mkdirp.sync(this.destinationPath('connect/config/keys'))
      }

      /**
       * RSA Key Pair
       */

      Generator.prototype.rsaKeyPair = function () {
        var callback = this.async()

        var prv = this.spawnCommand('openssl', [
          'genrsa',
          '-out',
          'connect/config/keys/private.pem',
          '4096'
        ])

        prv.on('exit', function () {
          var pub = this.spawnCommand('openssl', [
            'rsa',
            '-pubout',
            '-in',
            'connect/config/keys/private.pem',
            '-out',
            'connect/config/keys/public.pem'
          ])

          pub.on('exit', function () {
            callback()
          })
        }.bind(this))
      }

      /**
       * Self-signed SSL Cert
       */

      Generator.prototype.selfSignedCert = function () {
        if (this.ssl) {
          var callback = this.async()

          var subj = ''
          subj += '/C=' + this.C
          subj += '/ST=' + this.ST
          subj += '/L=' + this.L
          subj += '/O=' + this.O
          subj += '/CN=' + this.CN

          mkdirp.sync(this.destinationPath('nginx/certs'))
          var cert = this.spawnCommand('openssl', [
            'req',
            '-new',
            '-newkey',
            'rsa:4096',
            '-days',
            '365',
            '-nodes',
            '-x509',
            '-subj',
            subj,
            '-keyout',
            this.destinationPath(path.join('nginx', 'certs', 'nginx.key')),
            '-out',
            this.destinationPath(path.join('nginx', 'certs', 'nginx.crt'))
          ])

          cert.on('exit', function () {
            callback()
          })
        }
      }

      /**
       * Run
       */

      env.registerStub(Generator, 'connect:docker')
      env.run('connect:docker', function () {
        log('Connect all the things :)')
        done()
      })
    })
}

/**
 * Exports
 */

module.exports = registerInit
