module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        nodeunit: {
            all: ['test/*.js']
        },

        watch: {
            scripts: {
                files: ['**/*', '!node_modules/**/*'],
                tasks: ['nodeunit']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['nodeunit']);
    grunt.registerTask('test', ['nodeunit']);
};