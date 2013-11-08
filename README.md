# nodeunit-ci

Support for CI (continuous integration) with nodeuint.
Timeout can be set when start running.

## Install

Install with [npm](http://npmjs.org/):

    npm install nodeunit-ci

## API - simple test runner
    // Default timeout is 60sec
    require('nodeunit-ci').run('basic', __dirname);

### STDOUT
    4 Nov 13:48:51 - - basic.js (7ms, 100% perfect!)
   ![Alt text]( https://pbs.twimg.com/media/BYNNB09CMAACqkU.png "travis result")
  
## API - multiple + timeout(10sec)
  
    require('nodeunit-ci').run(['basic', 'state'] , __dirname, 10000);
  
## API - multiple + pipe + event

    // 2nd and 3rd parameter inherits to next task
    require('nodeunit-ci').run('basic', __dirname, 10000).pipe('state').on('end', function(results){
      console.log(results.length + ' test(s) finished');
    });

## see for test fileset
  - [node-localelist](https://github.com/ystskm/node-localelist)  
    ".travis.ymi", "package.js", "test/_runner.js" and "test/basic.js"
  