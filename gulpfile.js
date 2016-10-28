const gulp = require('gulp');

return gulp.task('testTask', (done)=> {
  console.log('test OK');
  return 0;
  done();
});

