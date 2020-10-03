// VARIABLES & PATHS

let preprocessor = 'scss', // Preprocessor (sass, scss, less, styl)
  fileswatch = 'html,htm,txt,json,md,woff2', // List of files extensions for watching & hard reload (comma separated)
  imageswatch = 'jpg,jpeg,png,webp,svg', // List of images extensions for watching & compression (comma separated)
  baseDir = 'app', // Base directory path without «/» at the end
  buildDir = 'build',
  online = true; // If «false» - Browsersync will work offline without internet connection

let paths = {

  scripts: {
    src: [
      // 'node_modules/jquery/dist/jquery.min.js', // npm vendor example (npm i --save-dev jquery)
      baseDir + '/js/app.js' // app.js. Always at the end
    ],
    dest: baseDir + '/js',
    build: buildDir
  },

  html: {
    src: [
      `${baseDir}/sections/*.html`,
      `!${baseDir}/sections/**/_*.html`],
    dest: baseDir + '/pages/',
    build: buildDir + '/pages/'
  },

  styles: {
    src: baseDir + '/' + preprocessor + '/main.*',
    dest: baseDir + '/css',
    build: buildDir + '/css',
  },

  images: {
    src: baseDir + '/assets/images/src/**/*',
    dest: baseDir + '/assets/images/dest',
    build: buildDir + '/assets/images',
  },

  fonts: {
    src: baseDir + '/assets/fonts/**/*',
    dest: baseDir + '/assets/fonts',
    build: buildDir + '/assets/fonts',
  },

  icons: {
    src: baseDir + '/assets/icons/**/*',
    dest: baseDir + '/assets/icons',
    build: buildDir + '/assets/icons',
  },

  deploy: {
    hostname: 'username@yousite.com', // Deploy hostname
    destination: 'yousite/public_html/', // Deploy destination
    include: [
      '*.htaccess',
      'assets',
      'css',
      'js',
      'pages'
    ], // Included files to deploy
    exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excluded files from deploy
  },

  cssOutputName: 'app.min.css',
  jsOutputName: 'app.min.js',

};

// LOGIC

const {src, dest, parallel, series, watch} = require('gulp');
const sass = require('gulp-sass');
const scss = require('gulp-sass');
const less = require('gulp-less');
const styl = require('gulp-stylus');
const cleancss = require('gulp-clean-css');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const rsync = require('gulp-rsync');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const rigger = require('gulp-rigger');
const gcmq = require('gulp-group-css-media-queries');

function browsersync() {
  browserSync.init({
    server: {baseDir: `${baseDir}`},
    notify: false,
    online: online
  })
}

function scripts() {
  return src(paths.scripts.src)
    .pipe(concat(paths.jsOutputName))
    .pipe(uglify())
    .pipe(dest(paths.scripts.dest))
    .pipe(browserSync.stream())
}

function htmlPages() {
  return src(paths.html.src)
    .pipe(rigger())
    .pipe(dest(paths.html.dest))
    .pipe(browserSync.stream())
}

function styles() {
  return src(paths.styles.src)
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(eval(preprocessor)())
    .pipe(concat(paths.cssOutputName))
    .pipe(autoprefixer({overrideBrowserslist: ['last 10 versions'], grid: true}))
    .pipe(gcmq()) // Компануем медиазапросы
    .pipe(sourcemaps.write('.'))
    .pipe(cleancss({level: {1: {specialComments: 0}},/* format: 'beautify' */}))
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream())
}

function images() {
  return src(paths.images.src)
    .pipe(newer(paths.images.dest))
    .pipe(imagemin())
    .pipe(dest(paths.images.dest))
}

function cleanimg() {
  return del('' + paths.images.dest + '/**/*', {force: true})
}

function deploy() {
  return src(baseDir + '/')
    .pipe(rsync({
      root: baseDir + '/',
      hostname: paths.deploy.hostname,
      destination: paths.deploy.destination,
      include: paths.deploy.include,
      exclude: paths.deploy.exclude,
      recursive: true,
      archive: true,
      silent: false,
      compress: true
    }))
}

function startwatch() {
  watch(baseDir + '/**/' + preprocessor + '/**/*', styles);
  watch(baseDir + '/**/sections/**/*', htmlPages);
  watch(baseDir + '/**/*.{' + imageswatch + '}', images);
  watch(baseDir + '/**/*.{' + fileswatch + '}').on('change', browserSync.reload);
  watch([baseDir + '/**/*.js', '!' + paths.scripts.dest + '/*.min.js'], scripts);
}

exports.browsersync = browsersync;
exports.assets = series(cleanimg, styles, scripts, images);
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.cleanimg = cleanimg;
exports.deploy = deploy;
exports.default = parallel(htmlPages, images, styles, scripts, browsersync, startwatch);
