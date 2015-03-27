/**
 * init
 */

function registerInit (cli, options, done) {
  cli.command('init')
    .handler(function (data, flags, done) {
      console.log('INIT');
      done();
    });

  done();
};


/**
 * Exports
 */

module.exports = registerInit;
