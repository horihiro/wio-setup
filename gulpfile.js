var gulp = require("gulp");
var babel = require("gulp-babel");
var eslint = require('gulp-eslint');
var plumber = require('gulp-plumber');
var notifier = require('node-notifier');

// eslint タスク（一時チェック）
gulp.task('lint', function() {
  return gulp.src(['src/*.js','src/lib/*.js']) // lint のチェック先を指定
    .pipe(plumber({
      // エラーをハンドル
      errorHandler: function(error) {
        var taskName = 'eslint';
        var title = '[task]' + taskName + ' ' + error.plugin;
        var errorMsg = 'error: ' + error.message;
        // ターミナルにエラーを出力
        console.error(title + '\n' + errorMsg);
        // エラーを通知
        notifier.notify({
          title: title,
          message: errorMsg,
          time: 3000
        });
      }
    }))
    .pipe(eslint({ useEslintrc: true })) // .eslintrc を参照
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
    .pipe(plumber.stop());
});

gulp.task('babel', function() {
  gulp.src(['./src/*.js', './src/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('./dist/'))
});

gulp.task('watch', function() {
  gulp.watch('./src/*.js', ['babel'])
});

gulp.task('default', ['babel', 'watch']);