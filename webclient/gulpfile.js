const config = require('./config');

const gulp        = require('gulp');
const addsrc      = require('gulp-add-src');
const babel       = require('gulp-babel');
const concat      = require('gulp-concat');
const csso        = require('gulp-csso')
const first       = require('gulp-first');
const htmlmin     = require('gulp-htmlmin');
const i18n        = require('gulp-html-i18n');
const i18nCompile = require('gulp-i18n-compile');
const gulpif      = require('gulp-if');
const inject      = require('gulp-inject');
const injectStr   = require('gulp-inject-string');
const injectHtml  = require('gulp-inject-stringified-html');
const markdown    = require('gulp-markdown');
const preprocess  = require('gulp-preprocess');
const purgecss    = require('gulp-purgecss');
const rename      = require('gulp-rename');
const sass        = require('gulp-sass')(require('node-sass'));
const splitFiles  = require('gulp-split-files');
const uglify      = require('gulp-uglify');
const yaml        = require('gulp-yaml');

const browserify = require('browserify');
const del        = require('delete');
const fs         = require('fs');
const merge      = require('merge-stream');
const path       = require('path');
const source     = require('vinyl-source-stream');


var htmlmin_options = {
    caseSensitive: false,
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: false,
    collapseWhitespace: true,
    conservativeCollapse: false,
    html5: true,
    includeAutoGeneratedTags: false,
    keepClosingSlash: false,
    minifyCSS: true,
    minifyJS: true,
    preserveLineBreaks: false,
    preventAttributesEscaping: false,
    //processConditionalComments: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeOptionalTags: false,  //!
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortAttributes: true,
    //sortClassName: true
};

var i18n_options = {
    langDir: 'build/tmp/locale'
};

var babel_targets = {
    "browsers": [
        "last 2 versions",
        "not dead",
        "> 0.2%",
        "IE>=10"
    ]
};


// --- Preparations ---
function clean_build(cb) {
    del(['build/**'], cb);
}

// --- Main CSS Pipeline ---
function compile_main_scss() {
    return merge(["light", "dark"].map(function(theme) {
        return gulp.src('src/main.scss')
                   .pipe(injectStr.prepend('$theme: "' + theme + '";\n'))
                   .pipe(sass().on('error', sass.logError))
                   .pipe(rename('main-' + theme + '.css'))
                   .pipe(gulp.dest('build/tmp'));
    }));
}

function compile_spectre_scss() {
    return merge(["light", "dark"].map(function(theme) {
        return gulp.src('src/spectre-all.scss')
                   .pipe(injectStr.prepend('$theme: "' + theme + '";\n'))
                   .pipe(sass().on('error', sass.logError))
                   .pipe(purgecss({
                       content: ['src/index.html', 'src/views/*/*.inc']
                   }))
                   //.pipe(csso())
                   .pipe(rename('spectre-all-purged-' + theme + '.css'))
                   .pipe(gulp.dest('build/tmp'));
    }));
}

/*function merge_main_css() {
    return merge(["light", "dark"].map(function(theme) {
        return gulp.src(['build/tmp/main-' + theme + '.css',
                         'build/tmp/spectre-all-purged-' + theme + '.css'])
                   .pipe(concat('app-main-merged-' + theme + '.css'))
                   .pipe(gulp.dest('build/css'))
                   .pipe(csso())
                   .pipe(rename('app-main-merged-' + theme + '.min.css'))
                   .pipe(gulp.dest('build/css'));
    }));
}*/
gulp.task('main_css', gulp.series(compile_main_scss, compile_spectre_scss/*, merge_main_css*/));


// --- Main JS Pipeline ---
function build_app_core_js() {
    return gulp.src(['src/core.js'])
               .pipe(concat('app-core.js'))
               .pipe(preprocess({
                    context: {
                        app_prefix: config.app_prefix,
                        cdn_prefix: config.cdn_prefix,
                        api_prefix: config.api_prefix,
                        target: config.target
                    },
                    includeBase: 'src/js'
                }))
               .pipe(gulp.dest('build/js'));
}

function build_app_rest_js() {
    return gulp.src(['src/modules/interactive-map.js',
                     'src/modules/autocomplete.js',
                     // History states are here because usually this module is not needed
                     // very soon, and if it is still missing this is not a real issue.
                     'src/history-states.js'])
               .pipe(concat('app-rest.js'))
               .pipe(preprocess({
                    context: {
                        app_prefix: config.app_prefix,
                        cdn_prefix: config.cdn_prefix,
                        api_prefix: config.api_prefix,
                        target: config.target
                    },
                    includeBase: 'src/js'
                }))
               .pipe(gulp.dest('build/js'));
}

function build_feedback_js() {
    return gulp.src('src/feedback.js')
               .pipe(i18n(i18n_options))
               .pipe(preprocess({
                    context: {
                        app_prefix: config.app_prefix,
                        cdn_prefix: config.cdn_prefix,
                        api_prefix: config.api_prefix,
                        target: config.target
                    },
                    includeBase: 'src/js'
                }))
               .pipe(uglify())
               .pipe(rename(path => { path.extname = ".min.js" }))
               .pipe(gulp.dest('build/js'));
}

function copy_vue_js() {
    if (config.target === "release")
        return gulp.src(['vendor/vue.min.js',
                         'vendor/vue-router.min.js',
                         'src/init-call.js'])
                   .pipe(concat('vue.min.js'))
                   .pipe(gulp.dest('build/js'));
    else
        return gulp.src(['vendor/vue.js',
                         'vendor/vue-router.js',
                         'src/init-call.js'])
                   .pipe(concat('vue.js'))
                   .pipe(gulp.dest('build/js'));
}

gulp.task('main_js', gulp.series(build_app_core_js, build_app_rest_js, build_feedback_js, copy_vue_js));


// --- Views compilation pipeline ---
gulp.task('views', function(done) {
    var views_src_path = 'src/views';

    var folders = getFolders(views_src_path);
    if (folders.length === 0) return done(); // nothing to do!

    var tasks = folders.map(function(folder) {
        var css_task = merge(["light", "dark"].map(function(theme) {
            return gulp.src(path.join(views_src_path, folder, '/view-' + folder + '.scss'))
                       .pipe(injectStr.prepend('$theme: "' + theme + '";\n'))
                       .pipe(sass().on('error', sass.logError))
                       .pipe(rename('view-' + theme +'.css'))
                       .pipe(gulp.dest('build/tmp/views/' + folder))})
        );

        var js_task = gulp.src(path.join(views_src_path, folder, '/view-' + folder + '.js'))
            .pipe(preprocess({
                context: {
                    app_prefix: config.app_prefix,
                    cdn_prefix: config.cdn_prefix,
                    api_prefix: config.api_prefix,
                    target: config.target
                },
                includeBase: path.join(views_src_path, folder)
            }))
            .pipe(rename('view.js'))
            .pipe(gulp.dest('build/tmp/views/' + folder))

        var html_task = gulp.src(path.join(views_src_path, folder, '/view-' + folder + '.inc'))
                            .pipe(preprocess({
                                context: {
                                    app_prefix: config.app_prefix,
                                    cdn_prefix: config.cdn_prefix,
                                    api_prefix: config.api_prefix,
                                    target: config.target
                                },
                                includeBase: path.join(views_src_path, folder)
                             }))
                            .pipe(htmlmin(htmlmin_options))
                            .pipe(gulp.dest('build/tmp/views/' + folder))

        return merge(css_task, js_task, html_task);
    });

    return merge(tasks);
});


// --- Build pages sources ---
gulp.task('pages_src', function(done) {
    var views_build_path = 'build/tmp/views';
    
    var folders = getFolders(views_build_path);
    if (folders.length === 0) return done(); // nothing to do!

    var tasks = folders.map(function(folder) {
        var view_css = merge(["light", "dark"].map(function(theme) {
            // Extract used spectre classes for this view and merge with core & view css
            var view_css_core = gulp.src('build/tmp/spectre-all-purged-' + theme + '.css')
                                    .pipe(concat('view-spectre-used.css'))
                                    .pipe(purgecss({
                                        content: ['src/index.html', 'src/views/' + folder + '/*.inc']
                                    }))
                                    .pipe(addsrc([path.join(views_build_path, folder, 'view-' + theme + '.css'),
                                                  'build/tmp/main-' + theme + '.css']))
                                    .pipe(concat('view-core-merged-' + theme + '.css'))
                                    .pipe(csso())
                                    .pipe(rename('view-core-merged-' + theme + '.min.css'))
                                    .pipe(gulp.dest('build/tmp/views/' + folder));
            
            // Merge remaining views css (TODO: include spectre somewhere else?)
            var view_css_rest = gulp.src(['build/tmp/views/*/view-' + theme + '.css',
                                          'build/tmp/spectre-all-purged-' + theme + '.css'],
                                         { ignore: path.join(views_build_path, folder, 'view-' + theme + '.css') })
                                    .pipe(concat('view-rest-merged-' + theme + '.css'))
                                    .pipe(gulp.dest('build/tmp/views/' + folder));
            return merge(view_css_core, view_css_rest);
        }));


        var view_js = gulp.src(path.join(views_build_path, folder, 'view.js'))
                          .pipe(injectHtml())
                          .pipe(rename('view-inlined.js'))
                          .pipe(gulp.dest('build/tmp/views/' + folder))
        
        return merge(view_css, view_js);
    });

    return merge(tasks);
});


// --- Build pages output ---
gulp.task('pages_out', function(done) {
    var views_build_path = 'build/tmp/views';
    
    var folders = getFolders(views_build_path);
    if (folders.length === 0) return done(); // nothing to do!

    var tasks = folders.map(function(folder) {
        var themed_tasks = merge(["light", "dark"].map(function(theme) {
            var view_html = gulp.src('src/index.html')
                                .pipe(rename('index-view-' + folder + '-' + theme + '.html'))
                                .pipe(i18n(i18n_options))
                                .pipe(preprocess({
                                    context: {
                                        view: folder,
                                        theme: theme,
                                        app_prefix: config.app_prefix,
                                        cdn_prefix: config.cdn_prefix,
                                        api_prefix: config.api_prefix,
                                        target: config.target
                                    },
                                    includeBase: path.join(views_build_path, folder)
                                }))
                                .pipe(inject(
                                    gulp.src(path.join(views_build_path,
                                                       folder,
                                                       'view-core-merged-' + theme + '.min.css')),
                                    {
                                        starttag: '<!-- inject:core:{{ext}} -->',
                                        transform: function (filePath, file) {
                                            return file.contents.toString('utf8')
                                        },
                                        quiet: true,
                                        removeTags: true,
                                    }
                                ))
                                .pipe(gulpif(config.target === "release", htmlmin(htmlmin_options)))
                                .pipe(gulp.dest('build'));
            
            var copy_css = gulp.src(path.join(views_build_path, folder, 'view-rest-merged-' + theme + '.css'))
                                   .pipe(csso())
                                   .pipe(rename('view-' + folder + '-rest-' + theme + '.min.css'))
                                   .pipe(gulp.dest('build/css'));

            return merge(view_html, copy_css);
        }));
        
        var copy_js_core = gulp.src(['build/js/app-core.js',
                                     path.join(views_build_path, folder, 'view-inlined.js')])
                               .pipe(concat('app-core-for-view-' + folder + '.js'))
                               .pipe(i18n(i18n_options))
                               .pipe(babel({
                                    presets: [[
                                        "@babel/preset-env",
                                        {
                                            targets: babel_targets,
                                            "useBuiltIns": false,
                                        }
                                    ]],
                               }))
                               .pipe(gulpif(config.target === "release", uglify()))
                               .pipe(gulpif(config.target === "release", rename(path => {
                                   path.extname = ".min.js"
                               })))
                               .pipe(gulp.dest('build/js'));
        
        var copy_js_rest = gulp.src(['build/js/app-rest.js',
                                     'build/tmp/views/*/view-inlined.js'],
                                    { ignore: path.join(views_build_path, folder, 'view-inlined.js') })
                               .pipe(concat('app-rest-for-view-' + folder + '.js'))
                               .pipe(i18n(i18n_options))
                               .pipe(babel())
                               .pipe(gulpif(config.target === "release", uglify()))
                               .pipe(gulpif(config.target === "release", rename(path => {
                                   path.extname = ".min.js"
                               })))
                               .pipe(gulp.dest('build/js'));
        
        return merge(themed_tasks, copy_js_core, copy_js_rest);
    });

    return merge(tasks);
});


// --- Legacy JS Pipeline ---
function extract_polyfills() {
    return gulp.src(['src/legacy.js', 'build/js/app-core.js', 'build/js/app-rest.js'])
               .pipe(concat('tmp-merged.js'))
               .pipe(babel({
                    presets: [[
                        "@babel/preset-env",
                        {
                            targets: babel_targets,
                            "useBuiltIns": "usage",
                            "corejs": "3.8"
                        }
                    ]],
                    sourceType: "module"
                }))
               .pipe(splitFiles())
               .pipe(first())
               // Add custom polyfills for missing browser (not ES) features
               .pipe(addsrc('vendor/whatwg-fetch-3.6.2.umd.js'))
               .pipe(concat('polyfills.js'))
               .pipe(gulp.dest('build/tmp'));
}

function insert_polyfills() {
    var bundleStream = browserify('./build/tmp/polyfills.js').bundle()

    return bundleStream
        .pipe(source('polyfills.js'))
        .pipe(gulp.dest('build/js'))
}

gulp.task('legacy_js', gulp.series(extract_polyfills, insert_polyfills));

// --- I18n Pipeline ---
function i18n_compile_langfiles() {
    return gulp.src(['src/i18n.yaml',
                     'src/views/*/i18n-*.yaml'])
               .pipe(yaml())
               .pipe(i18nCompile("[locale]/_.json", {localePlaceholder: "[locale]"}))
               .pipe(gulp.dest('build/tmp/locale'))
}

// --- Markdown Pipeline ---
const renderer = {
    code(code, infostring) {
        return `<pre class="code" data-lang="${infostring}"><code>${code}</code></pre>`;
    },
    link(href, title, text) {
        if (href.startsWith('http'))
            return `<a href="${href}" target="_blank">${text}</a>`;
        else
            return `<router-link to="${href}">${text}</router-link>`;
    },
};
markdown.marked.use({ renderer });

function compile_markdown() {
    return gulp.src('src/md/*.md')
               .pipe(markdown({
                   headerPrefix: 'md-',
               }))
               .pipe(gulp.dest('build/pages'))
}
gulp.task('markdown', compile_markdown);

// --- Asset Pipeline ---
function copy_assets() {
    return gulp.src('src/assets/**')
               .pipe(gulp.dest('build/assets'))
}
gulp.task('assets', copy_assets);

// --- Vendor src Pipeline ---
function copy_vendor_css() {
    return gulp.src(['vendor/leaflet-1.7.1.css'])
               .pipe(gulp.dest('build/css'))
}
function copy_vendor_js() {
    return gulp.src(['vendor/leaflet-1.7.1.min.js'])
               .pipe(gulp.dest('build/js'))
}
gulp.task('vendor', gulp.parallel(copy_vendor_css, copy_vendor_js));


/* === Utils === */

// from https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-task-steps-per-folder.md
function getFolders(dir) {
    return fs.readdirSync(dir)
      .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
      });
}


exports.build = gulp.series(
    clean_build,
    i18n_compile_langfiles,
    gulp.parallel('main_css', 'main_js', 'views', 'assets', 'vendor', 'markdown'),
    gulp.series('pages_src', 'pages_out', 'legacy_js')
);

exports.default = gulp.series(done => { config.target = "develop"; done(); }, exports.build);
exports.release = gulp.series(done => { config.target = "release"; done(); }, exports.build);
