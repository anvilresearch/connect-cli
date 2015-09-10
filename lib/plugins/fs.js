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
 * Serializers and deserializers
 */

var serializers = {}
var deserializers = {}

/**
 * Read file
 */

function read (path, format, options) {
  var data = fs.readFileSync(path, 'utf8')
  if (format) {
    return deserialize(data, format, options)
  } else {
    return data
  }
}

/**
 * Write file
 */

function write (path, data, format, options) {
  if (format) {
    data = serialize(data, format, options)
  }
  mkdirp.sync(dirname(path))
  fs.writeFileSync(path, data, 'utf8')
}

/**
 * Delete file
 */

function del (path) {
  try {
    if (fs.lstatSync(path).isDirectory()) {
      fs.rmdirSync(path)
    } else {
      fs.unlinkSync(path)
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }
}

/**
 * Serialize object for saving to filesystem
 */

function serialize (obj, format, options) {
  var serializer = getSerializer(format)
  if (!serializer) {
    throw new Error('No serializer registered for format ' + format)
  }
  return serializer(obj, options)
}

/**
 * Get serializer
 */

function getSerializer(format) {
  return serializers[format.toLowerCase()]
}

/**
 * Register serializer
 */

function registerSerializer (format, func) {
  serializers[format.toLowerCase()] = func
}

/**
 * Deserialize object after reading from filesystem
 */

function deserialize (data, format, options) {
  var deserializer = getDeserializer(format)
  if (!deserializer) {
    throw new Error('No deserializer registered for format ' + format)
  }
  return deserializer(data, options)
}

/**
 * Get deserializer
 */

function getDeserializer(format) {
  return deserializers[format.toLowerCase()]
}

/**
 * Register deserializer
 */

function registerDeserializer (format, func) {
  deserializers[format.toLowerCase()] = func
}

/**
 * Register fs functions
 */

function registerFS (cli, options, done) {
  cli.fs = {
    read: read,
    write: write,
    del: del,

    serialize: serialize,
    getSerializer: getSerializer,
    registerSerializer: registerSerializer,

    deserialize: deserialize,
    getDeserializer: getDeserializer,
    registerDeserializer: registerDeserializer
  }

  done()
}

/**
 * Exports
 */

module.exports = registerFS
