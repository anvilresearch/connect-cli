module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-release')
  grunt.loadNpmTasks('grunt-conventional-changelog')
  grunt.initConfig({
    changelog: {
      options: {
        // Task-specific options go here.
      }
    }

  })
}
