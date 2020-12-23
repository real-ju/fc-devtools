const { CURRENT_F, Fs } = require('./config');

module.exports = function(grunt) {
    grunt.initConfig({
        clean: {
            lib: cleanLibList(),
            util: cleanUtilList()
        },
        copy: {
            lib: {
                files: copyLibList()
            },
            util: {
                files: copyUtilList()
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'dist/archive.zip'
                },
                files: [
                    { expand: true, cwd: 'code/' + CURRENT_F + '/', src: ['**'] }
                ]
            }
        }
    })
    
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('update', ['clean', 'copy']);
    grunt.registerTask('update:lib', ['clean:lib', 'copy:lib']);
    grunt.registerTask('update:util', ['clean:util', 'copy:util']);
    grunt.registerTask('build', ['compress']);
}




function cleanLibList() {
    return Fs.map(item => {
        return 'code/' + item + '/node_modules'
    })
}

function cleanUtilList() {
    return Fs.map(item => {
        return 'code/' + item + '/util'
    })
}

function copyLibList() {
    return Fs.map(item => {
        return {
            expand: true,
            cwd: 'lib/node_modules',
            src: ['**'],
            dest: 'code/' + item + '/node_modules/'
        }
    })
}

function copyUtilList() {
    return Fs.map(item => {
        return {
            expand: true,
            cwd: 'util',
            src: ['**'],
            dest: 'code/' + item + '/util/'
        }
    })
}