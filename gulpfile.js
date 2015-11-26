/*global require:true, console:true */

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var minify = require('gulp-minify');
var minifycss = require('gulp-minify-css');
var concat = require('gulp-concat');

var copyTask = function() {
  gulp.src('./src/index.html')
    .pipe(gulp.dest('./app'));
  gulp.src('./src/css/*.css')
    .pipe(minifycss())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('./app/css'));
  gulp.src(['./src/js/jquery.min.js', '.src/js/bootstrap.js', '.src/js/underscore.min.js', './src/js/handlebars.js'])
    .pipe(minify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('./app/js'));
  gulp.src(['.src/js/main.js', '.src/js/radio.js'])
    .pipe(minify())
    .pipe(concat('radio.min.js'))
    .pipe(gulp.dest('./app/js'));
  console.log('Minify/Concat/Copy /src to /public');
};

gulp.task('copy', function() {
  copyTask();
});

var nodemonTask = function() {
  nodemon({
    tasks: ['copy'],
    script: 'app.js',
    verbose: true,
    env: { 'NODE_ENV': 'development' },
    watch: './src/',
    ext: 'css js html'
  });
};

gulp.task('start', function () {
  nodemonTask();
});

