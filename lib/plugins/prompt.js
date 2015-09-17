/**
 * Module dependencies
 */

var inquirer = require('inquirer')
var validator = require('lx-valid')
var chalk = require('chalk')
var async = require('async')
var _ = require('lodash')

/**
 * Prompt wrapper for inquirer which allows for extended validation.
 *
 * Would be used when a CLI command also accepts arguments that replace the
 * need to ask a particular question and/or when certain validation needs must
 * be met. This helps remove a lot of conditional boilerplate.
 *
 * Usage:
 *
 * ```javascript
 * cli.command('example').handler(function (data, flags, done) {
 *   cli.prompt([
 *     {
 *       type: 'input',
 *       name: 'email',
 *       message: 'Enter your e-mail address',
 *       value: flags['email'] || flags.e,
 *       format: 'email',
 *       required: true
 *     },
 *     {
 *       type: 'password',
 *       name: 'password',
 *       message: 'Enter your password',
 *       required: true
 *     }
 *   ], function (answers) {
 *     // ...
 *   })
 * })
 * ```
 */

function registerPrompt (cli, options, done) {
  /**
   * Allow localhost in URLs
   */
  var urlFormat = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
  validator.validate.formatExtensions.url = urlFormat

  /**
  * Wrap question
  */

  function wrapQuestion (question) {
    question = question || {}
    var wrappedQuestion = {}
    wrappedQuestion.schema = {}

    // Copy over all the properties from the original question
    Object.getOwnPropertyNames(question).forEach(function (property) {
      wrappedQuestion[property] = question[property]
      wrappedQuestion.schema[property] = question[property]
    })

    // `dataType` on a question -> `type` as used by revalidator/lx-valid
    // If `dataType` is not specified, infer it from the question type
    if (!question.dataType) {
      if (question.type === 'input' || question.type === 'password') {
        wrappedQuestion.schema.type = 'string'
      } else if (
        question.type === 'multiinput' ||
        question.type === 'checkbox'
      ) {
        // revalidator/lx-valid does not respect format if the type is an array,
        // so we must manually iterate over the elements and validate each one
        // individually. Hence, if a format is given, we set the schema type to
        // "string" instead of "array"
        wrappedQuestion.schema.type = question.format ? 'string' : 'array'
      } else if (question.type === 'confirm') {
        wrappedQuestion.schema.type = 'boolean'
      } else {
        delete wrappedQuestion.schema.type
      }
    // Otherwise, use the specified `dataType`
    } else {
      wrappedQuestion.schema.type = question.dataType
    }

    // If `enum` is not specified, and the question is a selection-type, infer
    // it from the choices
    if (!question.enum && question.choices) {
      // Set enum as a function so that if choices is a function that has logic
      // dependent on the state of answers, that the choices function is passed
      // the current answer set.
      wrappedQuestion.enum = function getEnum (answers) {
        var choices = question.choices

        if (typeof choices === 'function') {
          choices = choices(answers)
        }

        return choices.map(function (choice) {
          if (choice && typeof choice === 'object') {
            return choice.value || choice.name
          } else {
            return choice
          }
        })
      }
    }

    // `message` on a question has no equivalent with lx-valid. Passing the
    // question message as `message` to lx-valid has the effect of using the
    // message in place of any meaningful error output.
    delete wrappedQuestion.schema.message

    // Filter logic for additional support
    wrappedQuestion.filter = function (input) {
      var filteredInput = input

      // Convert numeric types
      if (
        wrappedQuestion.schema.type === 'number' ||
        wrappedQuestion.schema.type === 'float'
      ) {
        filteredInput = parseFloat(input)
      // Convert integers
      } else if (wrappedQuestion.schema.type === 'integer') {
        filteredInput = parseInt(input, 10)
      // Parse questions involving strings or arrays of strings
      } else if (
        question.type === 'input' ||
        question.type === 'multiinput' ||
        question.type === 'list' ||
        question.type === 'rawlist' ||
        question.type === 'checkbox' ||
        wrappedQuestion.schema.type === 'string'
      ) {
        // If a string...
        if (typeof input === 'string') {
          // Trim if requested
          if (question.trim) {
            filteredInput = filteredInput.trim()
          }
          // Set to undefined if empty
          if (!filteredInput) {
            filteredInput = undefined
          // If input is a string but an array is wanted, convert to an array
          } else if (wrappedQuestion.schema.type === 'array') {
            filteredInput = [filteredInput]
          }
        // If an array
        } else if (Array.isArray(input)) {
          // Trim all elements if requested
          if (question.trim) {
            filteredInput = input.map(function (str) {
              if (typeof input === 'string') {
                return str.trim()
              } else {
                return str
              }
            })
          }
          // If the array is nothing but null/undefined/empty strings, set it
          // to undefined
          if (!filteredInput.some(function (str) { return str })) {
            filteredInput = undefined
          }
        }
      }

      // Run custom filter function if specified
      if (question.filter) {
        return question.filter.call(this, filteredInput)
      } else {
        return filteredInput
      }
    }

    // Inner validation logic
    wrappedQuestion.validator = function (input, answers) {
      // Run filter first to clean up input
      var filteredInput = wrappedQuestion.filter(input)
      var valid, validationResults

      // Retrieve enum property for schema validation
      if (typeof wrappedQuestion.enum === 'function') {
        wrappedQuestion.schema.enum = wrappedQuestion.enum(answers)
      }

      // If we're working with a multi-input field that doesn't use an array
      // data type, we'll need to iterate over the multiple inputs and run
      // validation against each element individually
      if (
        wrappedQuestion.schema.type !== 'array' &&
        question.type === 'multiinput' &&
        Array.isArray(filteredInput)
      ) {
        validationResults = { valid: true, errors: [] }
        filteredInput.forEach(function (elem) {
          var validation = validator.validate({
            answer: elem
          }, {
            properties: { answer: wrappedQuestion.schema }
          })

          if (!validation.valid) {
            validationResults.valid = false
            validationResults.errors.push.apply(
              validationResults.errors, validation.errors
            )
          }
        })
      // Otherwise, just call the validator on the input directly
      } else {
        validationResults = validator.validate({
          answer: filteredInput
        }, {
          properties: { answer: wrappedQuestion.schema }
        })
      }

      // Provide more helpful error messages if an enum check failed
      // "must be present in given enumerator"
      // becomes
      // "must be one of: a, b, c"
      validationResults.errors.forEach(function (error) {
        if (Array.isArray(error.expected)) {
          error.message = error.message.replace(
            /present in given enumerator$/,
            'one of: ' + error.expected.join(', ')
          )
        }
      })

      // If invalid, return errors
      if (!validationResults.valid) {
        valid = validationResults.errors
      // If valid, invoke custom validate function if provided
      } else if (question.validate) {
        // Get validation results
        var validation = question.validate.call(this, input, answers)
        // If invalid...
        if (validation !== true) {
          // If a message was returned, return a revalidator-style error object
          // array
          if (typeof validation === 'string') {
            valid = [{ actual: input, message: validation }]
          // If an object was returned, return an array for consistency
          } else if (typeof validation === 'object') {
            valid = [validation]
          // If an array was returned, return it directly
          } else if (Array.isArray(validation)) {
            valid = validation
          // Otherwise, only false was returned, so return generic error info
          } else {
            valid = [{ actual: input, message: 'is not valid' }]
          }
        // If valid, return true
        } else {
          valid = true
        }
      // If valid, return true
      } else {
        valid = true
      }
      return valid
    }

    // Wrap inner validation logic with a validate function that outputs the
    // error message to screen and returns a boolean, which is what Inquirer
    // expects
    wrappedQuestion.validate = function (input, answers) {
      var valid = wrappedQuestion.validator.call(this, input, answers)

      if (valid === true) {
        return true
      } else {
        cli.log.error(' Input ' + valid[0].message)
        return false
      }
    }

    return wrappedQuestion
  }

  // Create `prompt` function similar to that of Inquirer's
  cli.prompt = function (questions, callback) {
    var questionsToAsk = []
    var answers = {}

    // Grab each question's `value` field, evaluate it if necessary, and wrap
    // each question
    questions = questions.map(function (question) {
      var value = typeof question.value === 'function'
        ? question.value()
        : question.value
      if (typeof value !== 'undefined') {
        answers[question.name] = value
      }
      return wrapQuestion(question)
    })

    questions.forEach(function (question) {
      var value = answers[question.name]
      // Question has no value, ask for one
      if (typeof value === 'undefined') {
        questionsToAsk.push(question)
      // Question already has a value, no need to ask it if it's valid
      } else {
        // Check if value is valid
        var valid = question.validator(answers[question.name], answers)
        // If invalid...
        if (valid !== true) {
          // Log an error and ignore the invalid value
          cli.log.error(valid[0].actual + ' ' + valid[0].message)
          value = undefined
        // If valid...
        } else {
          // Get a filtered copy of the value and use it
          value = question.filter(answers[question.name], answers)
        }
        // Ensure answers object has the current copy of the value
        answers[question.name] = value
        // If `value` is undefined (which it will be if it is either not
        // specified or invalid), mark the question for being asked
        if (typeof value === 'undefined') {
          questionsToAsk.push(question)
        }
      }
    })

    // Iterate through each question and ask it manually
    //
    // This is required in order to be able to implement logic that reruns
    // questions as Inquirer has very limited support for anything beyond
    // simple usage of its API
    async.mapSeries(questionsToAsk, function (question, next) {
      var responses = []
      var defaultValue = question.default
      var defaultIndex = 0
      var hasMultiDefaults = Array.isArray(defaultValue) && defaultValue.length

      function ask () {
        // Create a prompter
        var ui = new inquirer.ui.Prompt(inquirer.prompt.prompts)
        // Set the answers already known
        ui.existingAnswers = answers
        if (question.type === 'multiinput') {
          if (hasMultiDefaults) {
            // If working with a multi-input question, and defaults are given, set
            // the default for the current question
            if (defaultValue.length - defaultIndex >= 1) {
              question.default = defaultValue[defaultIndex]
            // Otherwise, if we're past the defaults, allow adding more entries
            } else if (defaultIndex >= 1) {
              delete question.default
              cli.log('Leave blank to finish adding entries.')
            } else {
              delete question.default
            }
          }
        }
        // Run the prompter
        ui.run([question], function () {
          // If we are working with a multi-input question
          if (question.type === 'multiinput') {
            // If nothing was specified (blank input), and we don't have any
            // more default values to iterate through
            if (!answers[question.name] && (
                !hasMultiDefaults || (defaultValue.length - defaultIndex) <= 1
              )) {
              // Set the final answer to the accumulated responses given and
              // move on to the next question
              answers[question.name] = responses
              next()
            // Otherwise, append the current entry onto the list of responses
            // and ask the question again
            } else {
              if (Array.isArray(answers[question.name])) {
                responses.push.apply(responses, answers[question.name])
              } else {
                responses.push(answers[question.name])
              }
              answers[question.name] = responses
              question.schema.required = false
              defaultIndex++
              ask()
            }
          // If not, just move on to the next question
          } else {
            next()
          }
        })
      }

      ask()
    }, function () {
      callback(answers)
    })
  }

  /**
   * Extending Inquirer
   *
   * Required because Inquirer has very shoddy extensibility, and as such these
   * minor patches are required to get desired behaviour out of the toolkit.
   */

  // Allow the question logic to be aware of prior answers, whether they have
  // come from the command-line arguments or the prompt
  var processQuestion = inquirer.ui.Prompt.prototype.processQuestion
  inquirer.ui.Prompt.prototype.processQuestion = function () {
    if (this.existingAnswers) {
      this.answers = this.existingAnswers
      delete this.existingAnswers
    }
    return processQuestion.apply(this, arguments)
  }

  inquirer.prompt.registerPrompt('multiinput', inquirer.prompt.prompts.input)

  // Avoid printing "undefined" to screen if input value is undefined
  inquirer.prompt.prompts.input.prototype.render = function (error) {
    var cursor = 0
    var message = this.getQuestion()

    if (this.status === 'answered' && this.answer !== undefined) {
      message += chalk.cyan(this.answer)
    } else {
      message += this.rl.line
    }

    if (error) {
      message += '\n' + chalk.red('>> ') + error
      cursor++
    }

    this.screen.render(message, { cursor: cursor })
  }

  // Allow disabled list items to utilize the `checked` property
  inquirer.prompt.prompts.checkbox.prototype.getCurrentValue = function () {
    var choices = this.opt.choices.filter(function (choice) {
      return !!choice.checked
    })

    this.selection = _.pluck(choices, 'name')
    return _.pluck(choices, 'value')
  }

  done()
}

/**
 * Exports
 */

module.exports = registerPrompt
