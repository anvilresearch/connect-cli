/* global process */

/**
 * Module dependencies
 */

var dirname = require('path').dirname
var mkdirp = require('mkdirp')
var yaml = require('js-yaml')
var fs = require('fs')
var _ = require('lodash')

/**
 * Read file
 */

function read (path) {
  return fs.readFileSync(path, 'utf8')
}

/**
 * Write file
 */

function write (path, data) {
  mkdirp.sync(dirname(path))
  fs.writeFileSync(path, data, 'utf8')
}

/**
 * Read YAML file
 */

function readYAML (path) {
  return yaml.safeLoad(read(path))
}

/**
 * Write YAML file
 */

function writeYAML (path, data, overwrite) {
  if (!overwrite) {
    try {
      data = _.extend({}, readYAML(path), data)
    } catch (e) {}
  }
  write(path, yaml.safeDump(data))
}

/**
 * Read JSON file
 */

function readJSON (path) {
  return JSON.parse(read(path))
}

/**
 * Write JSON file
 */

function writeJSON (path, data, pretty, overwrite) {
  if (!overwrite) {
    try {
      data = _.extend({}, readJSON(path), data)
    } catch (e) {}
  }
  if (pretty) {
    write(path, JSON.stringify(data, null, 2))
  } else {
    write(path, JSON.stringify(data))
  }
}

/**
 * Register fs functions
 */

function registerFS (cli, options, done) {
  cli.fs = {
    read: read,
    write: write,
    readYAML: readYAML,
    writeYAML: writeYAML,
    readJSON: readJSON,
    writeJSON: writeJSON
  }

  done()
}

/**
 * Exports
 */

module.exports = registerFS
