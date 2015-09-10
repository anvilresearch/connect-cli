/**
 * Module dependencies
 */

var inquirer = require('inquirer')

/**
 * Prompt
 */

function registerPrompt (cli, options, done) {
  /**
   * Prompt wrapper for inquirer which allows skipping questions that already
   * have a value.
   *
   * Would be used when a CLI command also accepts arguments that replace the
   * need to ask a particular question. This helps remove a lot of conditional
   * boilerplate.
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
   *       value: flags.email
   *     },
   *     {
   *       type: 'input',
   *       name: 'password',
   *       message: 'Enter your password'
   *     }
   *   ], function (answers) {
   *     // ...
   *   })
   * })
   * ```
   */
  cli.prompt = function (questions, callback) {
    var askedQuestions = []
    var skippedQuestions = []

    questions.forEach(function (question) {
      // Question has no value, ask for one
      if (typeof question.value === 'undefined') {
        askedQuestions.push(question)
      // Question has a value function which evaluates to nothing; ask it
      } else if (typeof question.value === 'function' &&
        typeof question.value() === 'undefined') {
        askedQuestions.push(question)
      // Question already has a value, no need to ask it
      } else {
        skippedQuestions.push(question)
      }
    })

    inquirer.prompt(askedQuestions, function (answers) {
      skippedQuestions.forEach(function (question) {
        answers[question.name] = typeof question.value === 'function' ?
          question.value() :
          question.value
      })

      callback(answers)
    })
  }

  done()
}

/**
 * Exports
 */

module.exports = registerPrompt
