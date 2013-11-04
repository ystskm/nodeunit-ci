/***/
/* node [npm:nodeunit-ci] index.js */
var path = require('path'), util = require('util');
var nodeunit = require('nodeunit');

// running target
var _runner = null;

// constant
var State = {
  Pending: 'pending',
  Running: 'running',
  Done: 'done',
  Fail: 'fail'
}

//constant
var ErrMsg = {
  AlreadyInUse: 'This test runner have already called run() method.'
};

//exports
module.exports = Runner;
function Runner() {
  if(!(this instanceof Runner))
    return new Runner();
  this._state = State.Pending;
  this.ok = 0, this.err = 0, this.dur = 0;
}

var RProtos = {
  run: run,
  state: state
};
for( var i in RProtos)
  Runner.prototype[i] = RProtos[i];
Runner.run = _run;

function run(files, opts) {

  _runner = this;

  // already in use or used, throws error.
  if(_runner.state() != State.Pending)
    throw new Error(Error.AlreadyInUse + ' :' + _runner.state());
  _runner.state(State.Running);

  //{opts}[String || Object]
  //  makePath: a function to get a test suite
  if(!opts)
    opts = {}
    // when opts is string, use it as path prefix.
  else if(typeof opts == 'string')
    opts = {
      makePath: _makePathFn(opts)
    };

  // if makePath is not a function, 
  if(typeof opts.makePath != 'function')
    opts.makePath = _makePathFn();

  // convert to array to accept an test file string.
  files = Array.isArray(files) ? files: [files];
  // kick nodeunit runner.
  nodeunit.runFiles(files.map(function(fnam) {
    return opts.makePath(fnam + '.js');
  }), {
    done: _done
  });

};
/**
 * @api
 */
function state(v) {
  return v ? (this._state = v): this._state;
}

/**
 * @ignore
 */
function _run(files, opts) {
  return new Runner().run(files, opts);
}

/**
 * @ignore
 */
function _makePathFn(fix) {
  return function(p) {
    return fix && typeof fix == 'string' ? path.resolve(fix, p): p;
  };
}

/**
 * @ignore
 */
function _done() {
  _runner.err && (function() {
    throw new Error(_runner.err + ' Error(s).');
  })();
}

nodeunit.on('complete', function(name, results) {

  var p = parseInt(results.passes() / results.length * 1000) / 10;
  var s = p == 100 ? 'perfect!': 'ok';
  var m = results.duration + 'ms, ' + p + '% [' + results.passes() + '/'
    + results.length + '] ' + s;
  util.log('- ' + name + ' (' + m + ')');

  _runner.ok += results.passes(), _runner.dur += results.duration;
  results.forEach(function(rslt) {
    if(rslt.error == null)
      return;
    _runner.err++, console.log("\t", rslt.method, rslt.message, rslt.error,
      rslt.passed(), rslt.failed());
  });

});
