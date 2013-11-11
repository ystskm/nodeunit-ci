/***/
/* node [npm:nodeunit-ci] index.js */
var path = require('path'), util = require('util');
var inherits = util.inherits, Emitter = require('events').EventEmitter;
var nodeunit = require('nodeunit');

// running target
var _runner = null;
var _lastnm = null;
var Q = [];

// constant
var State = {
  Pending: 'pending',
  Running: 'running'
}

// constant
var Event = {
  Error: 'error',
  End: 'end'
};

//constant
var DefaultTimeout = 1000 * 60, ErrMsg = {
  OthersAreProcessing: 'Another runner is running.',
  AlreadyInUse: 'This test runner have already called run() method.',
  Timeout: 'Execution timeout.'
};

//exports
module.exports = Runner;
function Runner() {
  if(!(this instanceof Runner))
    return new Runner();
  Emitter.call(this);
  this._state = State.Pending;
}
inherits(Runner, Emitter);

var RProtos = {
  run: run,
  pipe: pipe,
  state: state
};
for( var i in RProtos)
  Runner.prototype[i] = RProtos[i];
Runner.run = _run;

function run(files, opts, timeout) {

  if(_runner != null)
    throw new Error(ErrMsg.OthersAreProcessing);

  // inherits
  this._opts && !opts && (opts = this._opts);
  this._opts = opts;

  // inherits
  this._timeout && typeof timeout != 'number' && (timeout = this._timeout);
  this._timeout = typeof timeout == 'number' ? timeout: DefaultTimeout;

  // set global runner (only one)
  _runner = this, _runner._timer = setTimeout(_timeout, this._timeout);

  // already in use or used, throws error.
  if(_runner.state() != State.Pending)
    throw new Error(ErrMsg.AlreadyInUse + ' :' + _runner.state());
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
    moduleStart: _initPerModule,
    done: _taskDone
  });

  return this;

};

/**
 * @api
 */
function pipe() {
  if(_runner == null)
    return this.run.apply(this, arguments);
  Q.push([this, arguments]);
  return this;
}

/**
 * @api
 */
function state(v) {
  return v ? (this._state = v): this._state;
}

/**
 * @ignore
 */
function _run(files, opts, timeout) {
  return new Runner().run(files, opts, timeout);
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
function _initPerModule() {
  _runner.ok = 0, _runner.err = 0, _runner.dur = 0;
}

/**
 * @ignore
 */
function _taskDone() {

  var args = arguments;
  if(_runner.err)
    return _fail(_runner.err + ' Error(s).');

  _taskFinalize(function(_r) {
    _r.emit(Event.End, args);
  });

  Q.length && (function() {
    var task = Q.shift();
    task[0].run.apply(task[0], task[1]);
  })();

}

/**
 * @ignore
 */
function _taskFinalize(callback) {
  if(_runner == null)
    return;
  var _r = _runner;
  _runner = null, _lastnm = null, _r._timer && clearTimeout(_r._timer), _r
      .state(State.Pending), callback(_r);
}

/**
 * @ignore
 */
function _fail(e) {
  e = typeof e == 'string' ? new Error(e): e;
  _taskFinalize(function(_r) {
    _r.listeners(Event.Error) ? _r.emit(Event.Error, e): (function() {
      throw e;
    })()
  });
}

/**
 * @ignore
 */
function _timeout() {
  util.error(ErrMsg.Timeout);
  _fail('Last complete: ' + _lastnm
    + (_runner.err ? ', ' + _runner.err + ' Error(s).': ''));
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

});
