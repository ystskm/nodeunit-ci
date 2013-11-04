/***/
/* node [npm:nodeunit-ci] index.js */
var path = require('path'), util = require('util');
var nodeunit = require('nodeunit');

// running target
var _runner = null;
var _lastnm = null;

// constant
var State = {
  Pending: 'pending',
  Running: 'running',
  Done: 'done',
  Fail: 'fail'
}

//constant
var DefaultTimeout = 1000 * 60, ErrMsg = {
  AlreadyInUse: 'This test runner have already called run() method.',
  Timeout: 'Execution timeout.'
};

//exports
module.exports = Runner;
function Runner() {
  if(!(this instanceof Runner))
    return new Runner();
  this._state = State.Pending;
}

var RProtos = {
  run: run,
  state: state
};
for( var i in RProtos)
  Runner.prototype[i] = RProtos[i];
Runner.run = _run;

function run(files, opts, timeout) {

  _runner = this, _runner._timer = setTimeout(_timeout,
    typeof timeout == 'number' ? timeout: DefaultTimeout);

  // already in use or used, throws error.
  if(_runner.state() != State.Pending)
    throw new Error(Error.AlreadyInUse + ' :' + _runner.state());
  _runner.state(State.Running), _init();

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
function _init() {
  _runner.ok = 0, _runner.err = 0, _runner.dur = 0;
}

/**
 * @ignore
 */
function _done() {
  clearTimeout(_runner._timer);
  _runner.err && (function() {
    throw new Error(_runner.err + ' Error(s).');
  })();
  _runner = null, _lastnm = null;
}

/**
 * @ignore
 */
function _timeout() {
  util.error(ErrMsg.Timeout);
  var lrun = _runner, lnmsg = 'Last complete: ' + _lastnm;
  _runner = null, _lastnm = null;
  lrun.err ? (function() {
    throw new Error(lnmsg + ', ' + lrun.err + ' Error(s).');
  })(): (function() {
    throw new Error(lnmsg);
  })();
}

nodeunit.on('complete', function(name, results) {

  var p_cnt = results.passes(), a_cnt = results.length
  var p = a_cnt ? parseInt(p_cnt / a_cnt * 1000) / 10: 100;
  var s = p == 100 ? 'perfect!': 'ok', m = results.duration + 'ms, ' + p
    + '% [' + p_cnt + '/' + a_cnt + '] ' + s;
  _lastnm = name, util.log('- ' + name + ' (' + m + ')');

  _runner.ok += a_cnt, _runner.dur += results.duration;
  results.forEach(function(rslt) {
    if(rslt.error == null)
      return rslt.message
        && console.log("\t[" + rslt.method + "]", rslt.message);
    _runner.err++, console.log("\t", rslt.method, rslt.message, rslt.error,
      rslt.passed(), rslt.failed());
  });

  _init();

});
