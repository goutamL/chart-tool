var gulp = require("gulp"),
    gutil = require("gulp-util"),
    webpack = require("webpack"),
    webpackConfig = require("./webpack.config.js"),
    gulpConfig = require("./gulp-config.js");

// Build and watch cycle (another option for development)
// Advantage: No server required, can run app from filesystem
// Disadvantage: Requests are not blocked until bundle is available,

gulp.task("_webpack-build", function(callback) {
  // modify some webpack config options
  var myConfig = Object.create(webpackConfig);
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      "process.env": {
        // This has effect on the react lib size
        "NODE_ENV": JSON.stringify("production")
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  );

  // run webpack
  webpack(myConfig, function(err, stats) {
    if(err) throw new gutil.PluginError("_webpack-build", err);
    gutil.log("[_webpack-build]", stats.toString({
      colors: true
    }));
    callback();

    gulp.src([gulpConfig.buildPath + "/bundle.js", gulpConfig.buildPath + "/bundle.js.map"])
      .pipe(gulp.dest(gulpConfig.meteorBundle));

  });
});

gulp.task("_webpack-build-dev", function(done) {

  var webpackDevConfig = Object.create(webpackConfig);
  webpackDevConfig.devtool = "sourcemap";
  webpackDevConfig.debug = true;

  webpack(webpackDevConfig).run(function(err, stats) {

    if (err) { throw new gutil.PluginError("_webpack-build-dev", err); }

    gutil.log("[_webpack-build-dev]", stats.toString({
      colors: true
    }));

    gulp.src([gulpConfig.buildPath + "/bundle.js", gulpConfig.buildPath + "/bundle.js.map"])
      .pipe(gulp.dest(gulpConfig.meteorBundle));

    done();
  });

});