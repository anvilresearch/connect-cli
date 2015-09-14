/**
 * Module dependencies
 */

var path = require('path')
var mkdirp = require('mkdirp')
var crypto = require('crypto')
var chalk = require('chalk')
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
            log()
            done()
          } else {
            log()
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

      var cwd = process.cwd()
      var request = require('request')
      var AnvilConnectKeys = require('anvil-connect-keys')
      var keygen = new AnvilConnectKeys(path.join(cwd, 'connect'))
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
          default: 'connect.example.com'
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
              default: 'Anvil Research, Inc.'
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
        this.spawnCommand('git', ['init'], { stdio: 'ignore' })
        this.log('   ' + chalk.green('create ') + 'git repository')
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
        this.cookie_secret = crypto.randomBytes(10).toString('hex')
        this.session_secret = crypto.randomBytes(10).toString('hex')

        this.template(
          path.join(templates, 'connect', 'config', 'development.json'),
          this.destinationPath(path.join('connect', 'config', 'development.json'))
        )

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
       * Generate key pairs
       */

      Generator.prototype.generateKeyPairs = function () {
        keygen.generateKeyPairs()
        this.log('   ' + chalk.green('create ') + 'connect/keys/sig.rsa.pub.pem')
        this.log('   ' + chalk.green('create ') + 'connect/keys/sig.rsa.prv.pem')
        this.log('   ' + chalk.green('create ') + 'connect/keys/enc.rsa.pub.pem')
        this.log('   ' + chalk.green('create ') + 'connect/keys/enc.rsa.prv.pem')
      }

      /**
       * Generate setup token
       */

      Generator.prototype.generateSetupToken = function () {
        keygen.generateSetupToken()
        this.log('   ' + chalk.green('create ') + 'connect/keys/setup.token')
      }

      /**
       * Self-signed SSL Cert
       */

      Generator.prototype.selfSignedCert = function () {
        var self = this

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
          ], {
            stdio: 'ignore'
          })

          cert.on('exit', function () {
            self.log('   ' + chalk.green('create ') + 'nginx/certs/nginx.key')
            self.log('   ' + chalk.green('create ') + 'nginx/certs/nginx.cert')
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
  done()
}

/**
 * Exports
 */

module.exports = registerInit
