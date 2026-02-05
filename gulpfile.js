const { src, dest, watch, series } = require("gulp");

const sass = require("gulp-sass")(require("sass"));
const prefix = require("gulp-autoprefixer");
const minify = require("gulp-clean-css");
const terser = require("gulp-terser");
const imagemin = require("gulp-imagemin");
const rename = require("gulp-rename");
const wait = require("gulp-wait");

function compilescss() {
  return (
    src("src/scss/**/*.scss")
      .pipe(sass())
      .pipe(prefix())
      // .pipe(minify())
      .pipe(wait(1000))
      .pipe(rename({ dirname: "" }))
      .pipe(dest("assets"))
  );
}

function jsmin() {
  return src("src/js/*.js").pipe(terser()).pipe(dest("assets"));
}

function minifyAssetsJS() {
  return src(["assets/*.js", "!assets/*.min.js"])
    .pipe(terser())
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest("assets"));
}

function optimizeImg() {
  return src("src/images/*.{jpg,png,svg}")
    .pipe(
      imagemin([
        imagemin.mozjpeg({ quality: 80, progressive: true }),
        imagemin.optipng({ optimizationLevel: 2 }),
      ])
    )
    .pipe(dest("assets"));
}

function fonts() {
  return src("src/fonts/*.*").pipe(dest("assets"));
}

function watchTask() {
  watch("src/scss/**/*.scss", compilescss);
  watch("src/js/*.js", jsmin);
  watch("src/images/*.{jpg,png}", optimizeImg);
}

exports.default = series(compilescss, fonts, jsmin, optimizeImg, watchTask);
exports.minifyAssetsJS = minifyAssetsJS;
