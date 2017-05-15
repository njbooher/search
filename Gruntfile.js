module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    paths: {
      src: {
        css: [
          "lib/bootstrap-3.3.5/css/bootstrap.min.css",
          "distro-assets/lib/ResponsiveMultiLevelMenu/css/component.css",
          "lib/ng-trans.css",
          "lib/angular-pickadate/angular-pickadate.css",
          "distro-assets/lib/ss-social-regular/webfonts/ss-social-regular.css",
          "distro-assets/lib/ss-standard/webfonts/ss-standard.css",
          "distro-assets/lib/font-awesome/css/font-awesome.min.css",
          "distro-assets/common.css"
        ],
        js: [
          "lib/angular-1.4.3/angular.min.js",
          "lib/angular-1.4.3/angular-route.min.js",
          "lib/angular-1.4.3/angular-sanitize.min.js",
          "lib/angular-1.4.3/angular-animate.min.js",
          "lib/angular-1.4.3/angular-touch.min.js",
          "lib/angular-1.4.3/angular-aria.min.js",
          "lib/angular-breakpoint/breakpoint-0.0.1.js",
          "lib/ui-bootstrap-tpls-1.3.3.min.js",
          "lib/angular-recaptcha.min.js",
          "lib/jquery-1.11.3.min.js",
          "distro-assets/lib/ResponsiveMultiLevelMenu/js/modernizr.custom.js",
          "lib/bootstrap-3.3.5/js/bootstrap.min.js",
          "lib/typeahead/typeahead.bundle.min.js",
          "distro-assets/lib/jquery.dlmenu.custom.js",
          "lib/angular-pickadate/angular-pickadate.min.js",
          "lib/moment.min.js",
          "lib/angular-moment.min.js"
        ]
      },
      dest: {
        dist: "dist",
        css: "dist/css/libraries.css",
        cssMin: "dist/css/libraries.min.css",
        js: "dist/js/libraries.js",
        jsMin: "dist/js/libraries.min.js"
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'distro-assets/lib/font-awesome',
          src: ['fonts/*.*'],
          dest: '<%= paths.dest.dist %>'
        },
        {
          expand: true,
          dot: true,
          cwd: 'lib/bootstrap-3.3.5',
          src: ['fonts/*.*'],
          dest: '<%= paths.dest.dist %>'
        },
        {
          expand: true,
          dot: true,
          cwd: 'distro-assets/lib/ss-social-regular/webfonts',
          src: ['*.*'],
          dest: '<%= paths.dest.dist %>/css'
        },
        {
          expand: true,
          dot: true,
          cwd: 'distro-assets/lib/ss-standard/webfonts',
          src: ['*.*'],
          dest: '<%= paths.dest.dist %>/css'
        },
        {
          expand: true,
          dot: true,
          cwd: '',
          src: ['distro-assets/img/*.*'],
          dest: '<%= paths.dest.dist %>'
        }]
      },
    },
    concat: {
      css: {
        src: "<%= paths.src.css %>",
        dest: "<%= paths.dest.css %>"
      }
    },
    cssmin: {
      css:{
        src: "<%= paths.dest.css %>",
        dest: "<%= paths.dest.cssMin %>"
      }
    },
    uglify: {
      options: {
        compress: true,
        mangle: true,
        sourceMap: true
      },
      target: {
        src: "<%= paths.src.js %>",
        dest: "<%= paths.dest.jsMin %>"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("default", ["copy", "concat", "cssmin", "uglify"]);
};
