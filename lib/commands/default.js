/**
 * Default
 */

function registerDefault (cli, options, done) {
  cli.default()
    .handler(function (data, flags, done) {
      var log         = cli.log
        , logo        = cli.get('logo')
        , website     = cli.get('website')
        , description = cli.get('description')
        ;

      log.header(logo);
      log.link(website);
      log.br();
      log.header(description);
      log.br();
      done();
    });

  done();
};


/**
 * Exports
 */

module.exports = registerDefault;
