/**
 * Module dependencies
 */

var cp       = require('child_process')
  , fs       = require('fs-extra')
  , path     = require('path')
  , mkdirp   = require('mkdirp')
  , async    = require('async')
  , crypto   = require('crypto')
  , inquirer = require('inquirer')
  ;


/**
 * Safe JSON
 */

function safeJSON (file, obj) {
  return function (done) {
    fs.exists(file, function (exists) {
      if (exists) {
        console.log(' * %s already initialized.', file.replace(process.cwd() + '/', ''));
        return done();
      }

      fs.outputJSON(file, obj, { spaces: 2 }, function (err) {
        console.log(' * Generated %s', file.replace(process.cwd() + '/', ''));
        done(err);
      });
    })
  };
}


/**
 * Safe copy files and directories
 */

function safeCopy (from, to) {
  return function (done) {
    fs.exists(to, function (exists) {
      if (exists) {
        console.log(' * %s already initialized.', to);
        return done();
      }

      fs.copy(from, to, function (err) {
        console.log(' * Generated %s', to);
        done(err);
      });
    });
  };
}


/**
 * Initialize Directory
 *
 * If the directory exists and is not empty, this will prompt
 * to continue. If the directory does not exist, it will be
 * created and the process cwd changed.
 */

function directory (context) {
  return function (done) {
    var log = context.cli.log
      , dir = path.join(process.cwd(), context.dir)
      ;

    // if it's an existing directory
    if (fs.existsSync(dir)) {

      // and it's not empty
      if (fs.readdirSync(dir).length > 0) {
        // prompt to confirm
        inquirer.prompt([
          {
            type:     'confirm',
            name:     'existing',
            message:  'This is not an empty directory. Are you sure you want to proceed?',
            default:   false
          }
        ], function (answers) {
          if (answers.existing) {
            process.chdir(dir);
            log.br();
            done();
          } else {
            log.br();
            log.error('ABORTED');
            process.exit();
          }
        })
      }

      // otherwise continue
      else {
        done();
      }
    }

    else {
      mkdirp(dir, function (err) {
        if (err) { return done(err); }
        process.chdir(dir);
        done();
      });
    }
  }
}


/**
 * Initialize git
 */

function git (context) {
  return function (done) {
    var log = context.cli.log
      , dir = path.join(process.cwd(), context.dir)
      ;

    fs.exists(dir, function (exists) {
      if (exists) {
        log(' * Git repository already initialized.');
        return done();
      }

      cp.exec('git init', function (err, stdout, stderr) {
        log(' * Initialized git repository');
        done(err);
      });
    });
  };
}


/**
 * Initialize npm
 */

function npm (context) {
  var file = path.join(process.cwd(), context.dir, 'package.json');

  return safeJSON(file, {
    name:          path.basename(context.dir),
    version:      '0.0.0',
    description:  'Anvil Connect Deployment',
    private:       true,
    main:         'server.js',
    scripts: {
      start:      'node server.js'
    },
    engines: {
      node:       '>=0.12.0'
    },
    dependencies: {
      'anvil-connect': '0.1.42'
    }
  });
}


/**
 * Development configuration
 */

function development (context) {
  var file = path.join(process.cwd(), context.dir, 'config', 'development.json');

  return safeJSON(file, {
    port: 3000,
    issuer: 'http://localhost:3000',
    client_registration: 'scoped',
    cookie_secret: crypto.randomBytes(10).toString('hex'),
    session_secret: crypto.randomBytes(10).toString('hex'),
    providers: {
      password: true,
      google: {
        client_id: 'ID',
        client_secret: 'SECRET',
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email"
        ]
      }
    }
  });
}


/**
 * Production configuration
 */

function production (context) {
  var file = path.join(process.cwd(), context.dir, 'config', 'production.json');

  return safeJSON(file, {
    port: 80,
    issuer: 'https://HOST',
    client_registration: 'scoped',
    cookie_secret: crypto.randomBytes(10).toString('hex'),
    session_secret: crypto.randomBytes(10).toString('hex'),
    providers: {
      password: true,
      google: {
        client_id: 'ID',
        client_secret: 'SECRET',
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email"
        ]
      },
      redis: {
        url: 'redis://HOST:PORT',
        auth: 'PASSWORD'
      }
    }
  });
}


/**
 * Templates
 */

function files (context) {
  return function (done) {
    async.series([
      safeCopy(path.join(__dirname, '..', 'files', 'server.js'),  'server.js'),
      safeCopy(path.join(__dirname, '..', 'files', 'views'),      'views'),
      safeCopy(path.join(__dirname, '..', 'files', 'public'),     'public'),
      safeCopy(path.join(__dirname, '..', 'files', 'gitignore'),  '.gitignore'),
    ], function (err) {
      if (err) { return done(err); }
      done(err);
    });
  }
}


/**
 * Generate RSA Key Pair
 */

function keys (context) {
  var dir = path.join(process.cwd(), context.dir, 'config', 'keys')
    , pvt = path.join(dir, 'private.pem')
    , pub = path.join(dir, 'public.pem')
    ;

  return function (done) {
    fs.exists(dir, function (exists) {
      if (exists) {
        console.log(' * RSA key pair already initialized.');
        return done();
      }

      cp.exec('openssl genrsa 2048', function (err, stdout, stderr) {
        if (err) { return done(err); }

        fs.outputFile(pvt, stdout, function (err) {
          if (err) { return done(err); }

          var cmd = 'openssl rsa -in ' + pvt + ' -pubout';
          cp.exec(cmd, function (err, stdout, stderr) {
            if (err) { return done(err) }

            fs.outputFile(pub, stdout, function (err) {
              if (err) { return done(err); }

              console.log(' * Generated RSA keypair');
              done();
            });
          });
        });
      });
    });
  };
}


/**
 * Register command
 */

function registerInit (cli, options, done) {

  var init = cli.command('init')
    .handler(function (data, flags, done) {
      var log = cli.log;

      var context = {
        cli:     cli,
        options: options,
        data:    data,
        flags:   flags
      };

      context.dir = context.data[0] || '.';

      log.br();
      log.header('Initializing your new Anvil Connect instance.');
      log.br();

      async.series([
        directory(context),
        git(context),
        npm(context),
        development(context),
        production(context),
        files(context),
        keys(context)
      ], function (err, results) {
        log.br();
        log.header('DONE')
      });
    })

  init.task('docker')
    .handler(function (data, flags, done) {

      /**
       * Command dependencies
       */

      var yeoman = require('yeoman-environment');
      var generators = require('yeoman-generator');
      var env = yeoman.createEnv();
      var log = cli.log;

      /**
       * File and template  paths
       */

      var files = path.join(__dirname, '..', '..', 'files', 'docker')
      var templates = path.join(__dirname, '..', '..', 'templates', 'docker')

      /**
       * Generator
       */

      var Generator = generators.Base.extend({
        constructor: function () {
          generators.Base.apply(this, arguments);

          // arguments
          //this.argument('appname', { type: String, required: true });

          // options

          // destination
          // this.destinationRoot(?)
        }
      });

      /**
       * Prompt for Settings
       */

      Generator.prototype.promptSettings = function () {
        var callback = this.async();

        var questions = [
          {
            type:     'input',
            name:     'issuer',
            message:  'Issuer domain',
            default:  'connect.example.com'
          }
        ];

        this.prompt(questions, function (answers) {
          this.issuer = answers.issuer;
          callback();
        }.bind(this));

      };

      /**
       * Cookie/session secrets
       */

      Generator.prototype.secrets = function () {
        this.cookie_secret = crypto.randomBytes(10).toString('hex');
        this.session_secret = crypto.randomBytes(10).toString('hex');
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
          path.join(files, '.gitignore'),
          this.destinationPath('.gitignore')
        )
      }

      /**
       * Docker Compose
       */

      Generator.prototype.dc = function () {
        this.copy(
          path.join(files, 'docker-compose.yml'),
          this.destinationPath('docker-compose.yml')
        )
      }

      /**
       * Connect
       */

      Generator.prototype.connect = function () {
        // main tree
        this.directory(
          path.join(files, 'connect'),
          this.destinationPath('connect')
        )

        // config file
        this.template(
          path.join(templates, 'connect', 'config', 'production.json'),
          this.destinationPath(path.join('connect', 'config', 'production.json'))
        )

        // package.json
        this.template(
          path.join(templates, 'connect', 'package.json'),
          this.destinationPath(path.join('connect', 'package.json'))
        )

        // bower.json
        this.template(
          path.join(templates, 'connect', 'bower.json'),
          this.destinationPath(path.join('connect', 'bower.json'))
        )
      }

      /**
       * nginx
       */

      Generator.prototype.nginx = function () {
        // main tree
        this.directory(
          path.join(files, 'nginx'),
          this.destinationPath('nginx')
        )

        // virtual host
        this.template(
          path.join(templates, 'nginx', 'conf.d', 'default.conf'),
          this.destinationPath(path.join('nginx', 'conf.d', 'default.conf'))
        )

        // upstream entries
        //this.template(
        //  path.join(templates, 'nginx', 'conf.d', 'default.conf'),
        //  this.destinationPath(path.join('nginx', 'conf.d', 'default.conf'))
        //)
      }

      /**
       * Redis
       */

      Generator.prototype.redis = function () {
        this.directory(
          path.join(files, 'redis'),
          this.destinationPath('redis')
        )
      }

      /**
       * Keys directory
       */

      Generator.prototype.makeKeysDirectory = function () {
        mkdirp.sync(this.destinationPath('connect/config/keys'));
      }

      /**
       * RSA Key Pair
       */

      Generator.prototype.rsaKeyPair = function () {
        var callback = this.async();

        var prv = this.spawnCommand('openssl', [
          'genrsa',
          '-out',
          'connect/config/keys/private.pem',
          '4096'
        ]);

        prv.on('exit', function () {
          var pub = this.spawnCommand('openssl', [
            'rsa',
            '-pubout',
            '-in',
            'connect/config/keys/private.pem',
            '-out',
            'connect/config/keys/public.pem'
          ]);

          pub.on('exit', function () {
            callback();
          })
        }.bind(this));
      }

      /**
       * Certs directory
       */

      Generator.prototype.makeCertsDirectory = function () {
        mkdirp.sync(this.destinationPath('nginx/certs'));
      }
      /**
       * Self-signed SSL Cert
       */

      Generator.prototype.selfSignedCert = function () {
        var callback = this.async();

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
          '/C=US/ST=Denial/L=Springfield/O=Dis/CN=' + this.issuer,
          '-keyout',
          this.destinationPath(path.join('nginx', 'certs', this.issuer + '.key')),
          '-out',
          this.destinationPath(path.join('nginx', 'certs', this.issuer + '.cert'))
        ])

        cert.on('exit', function () {
          callback()
        })
      }

      /**
       * Run
       */

      env.registerStub(Generator, 'connect:docker');
      env.run('connect:docker', function () {
        log('Connect all the things :)')
        done()
      });
    })
}


/**
 * Exports
 */

module.exports = registerInit;
