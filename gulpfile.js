/*global require:true, console:true */

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyHTML = require('gulp-minify-html');
var minifycss = require('gulp-minify-css');
var concat = require('gulp-concat');
var del = require('del');


var hintTask = function () {
  gulp.src(['*.js', './src/js/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
  console.log('HINT: Hint Complete');
};

gulp.task('hint', function() {
  hintTask();
});


var cleanTask = function () {
  console.log('CLEAN: Clean Complete');
  return del([
    'app/**/*',
    '!app/img/',
    '!app/css/',
    '!app/fonts/',
    '!app/js/',
  ]);
};

gulp.task('clean', function() {
  cleanTask();
});


var buildTask = function() {
  gulp.src('./src/app.js')
    .pipe(gulp.dest('./app'));
  gulp.src('./src/index.html')
    .pipe(minifyHTML())
    .pipe(gulp.dest('./app'));
  gulp.src('./src/img/*')
    .pipe(gulp.dest('./app/img'));
  gulp.src('./src/fonts/*')
    .pipe(gulp.dest('./app/fonts'));
  gulp.src(['./src/css/bootstrap-v3.3.6.css', './src/css/main.css'])
    .pipe(concat('style.min.css'))
    .pipe(minifycss())
    .pipe(gulp.dest('./app/css'));
  gulp.src([
      './src/js/jquery-v2.1.4.js',
      './src/js/bootstrap-v3.3.6.js',
      './src/js/bootstrap-validator-v0.9.0.js',
      './src/js/bootstrap-progress-v0.9.0.js',
      './src/js/underscore-v1.8.3.js',
      './src/js/handlebars-v4.0.5.js'
  ])
    .pipe(concat('vendor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./app/js'));
  gulp.src(['./src/js/webrtc-adapter.js', './src/js/webrtc-audio.js', './src/js/webrtc-video.js'])
    .pipe(concat('webrtc.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./app/js'));
  gulp.src('./src/js/templates/*')
    .pipe(gulp.dest('./app/js/templates'));
  gulp.src(['./src/js/chat.js', './src/js/amplitude-v2.2.0.js', './src/js/radio.js'])
    .pipe(concat('radio.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./app/js'));
  console.log('BUILD: Build Complete');
};

gulp.task('build', function() {
  buildTask();
});


var watchTask = function() {
  gulp.src('./src/app.js')
    .pipe(gulp.dest('./app'));
  gulp.src('./src/index.html')
    .pipe(minifyHTML())
    .pipe(gulp.dest('./app'));
  gulp.src(['./src/css/bootstrap-v3.3.6.css', './src/css/main.css'])
    .pipe(concat('style.min.css'))
    .pipe(minifycss())
    .pipe(gulp.dest('./app/css'));
  gulp.src('./src/js/templates/*')
    .pipe(gulp.dest('./app/js/templates'));
  gulp.src(['./src/js/amplitude-v2.2.0.js', './src/js/chat.js', './src/js/radio.js'])
    .pipe(concat('radio.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./app/js'));
  console.log('WATCH: Watch Complete');
};

gulp.task('watch', function() {
  watchTask();
});



var nodemonTask = function() {
  nodemon({
    tasks: ['watch'],
    script: 'app.js',
    verbose: true,
    env: { 'NODE_ENV': 'development' },
    watch: ['./src/'],
    ext: 'css js html'
  });
};

gulp.task('run', function () {
  nodemonTask();
});

