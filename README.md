# nodeunit-ci

Support for CI (continuous integration) with nodeuint.
Timeout can be set when start running.

## Install

Install with [npm](http://github.com/isaacs/npm):

    npm install nodeunit-ci

## API - simple test runner
    // Default timeout is 60sec
    require('nodeunit-ci').run('basic', __dirname);

### STDOUT
    4 Nov 13:48:51 - - basic.js (7ms, 100% perfect!)
  
## API - multiple + timeout(10sec)
  
    require('nodeunit-ci').run('basic', __dirname, 10000);
  
## see for test fileset
  - [node-localelist](https://github.com/ystskm/node-localelist)  
    ".travis.ymi", "package.js", "test/_runner.js" and "test/basic.js"
  