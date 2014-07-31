"use strict";

var async = require('async');
var events = require('events');
var stream = require('stream');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;

var args = process.argv;
var direct_conf = parse_config(args[2]);
var mongos_conf = parse_config(args[3]);

var dbs = [];

var metadata = 'metadata';

function parse_config(param) {
  var values = (param || '').split(':');
  return [ (values[0] || '127.0.0.1'), (values[1] || '27017')];
}

//////////////////////////////////////////////////////////////////////////////////////////

var connections = {};

// Trigger Definition
var trigger_func = {
  lifetimes: new (require('./modules/lifetimes'))(connections),
  ancestors: new (require('./modules/ancestors'))(connections),
  embeddeds: new (require('./modules/embeddeds'))(connections),
  reverseEmbeddeds: new (require('./modules/reverseEmbeddeds'))(connections)
};

var trigger_map = {};

var now = Math.ceil((new Date()).getTime() / 1000);

var tasks = [];


tasks.push(function (next) {
  var config = url(direct_conf[0], direct_conf[1], 'local');
  MongoClient.connect(config, function (err, conn) {
    next(err, conn);
  });
});

tasks.push(function (conn, next) {
  var system = {
    config: 1,
    admin: 1,
    local: 1
  };
  conn.admin().listDatabases(function (err, list) {
    for (var i in list.databases) {
      var db = list.databases[i].name;
      if (!system[ db ]) {
        dbs.push(db);
      }
    }
    next(err, conn);
  });
});

tasks.push(function (conn, next) {
  async.eachSeries(dbs, function (name, done) {
    var config = url(mongos_conf[0], mongos_conf[1], name);
    MongoClient.connect(config, function (err, db) {
      connections[ name ] = db;
      trigger_map[ name ] = {};
      getTriggerData(name, trigger_map[ name ], function (err) {
        done(err)
      });
    });
  }, function (err) {
    next(err, conn);
  });
});

/**
 *
 * @param name DB名称
 * @param callback
 */
function getTriggerData(name, map, callback) {
  async.eachSeries(Object.keys(trigger_func), function (key, done) {
    var config = trigger_func[ key ].config;
    var coll = [ metadata, config ].join('.');
    connections[ name ].collection(coll).find().toArray(function (err, docs) {
      trigger_func[ key ].infos[ name ] = docs;
      trigger_func[ key ].map(name, map);
      done(err);
    });
  }, function (err) {
    console.log(JSON.stringify(trigger_map));
    callback(err);
  });
}


//////////////////////////////////////////////////////////////////////////////////////////////////////

function FilterBase() {
}

util.inherits(FilterBase, stream.Stream);

FilterBase.prototype.end = function () {
  this.emit('close');
};

FilterBase.prototype.pipe = function (dest) {
  this.piped = true;
  stream.Stream.prototype.pipe.apply(this, arguments);
  return dest;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

function Filter0(now) {
  this.now = now;
  this.piped = false;
  this.writable = true;
  this.timeoutId = 0;
  this.ops = [];
}

util.inherits(Filter0, FilterBase);

Filter0.prototype.write = function (op) {

  if (this.now < op.ts.high_) {

    var tag = op.ns.split('.');
    var map = trigger_map[ tag[0] ];
    if (( map && map[ op.ns ] ) || tag[1] === metadata) {

      this.ops.push(op);

      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
      }

      var self = this;
      if (100 <= this.ops.length) {
        // RangeError: Maximum call stack size exceeded
        // コールスタック制限対応のため100件で小切りにする
        self.timeoutId = 0;
        self.emit('data', self.ops);
        self.ops = [];
      } else {
        this.timeoutId = setTimeout(function () {
          self.timeoutId = 0;
          self.emit('data', self.ops);
          self.ops = [];
        }, 200);
      }
    }
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

function Filter1() {
  this.piped = false;
  this.writable = true;
}

util.inherits(Filter1, FilterBase);

Filter1.prototype.write = function (ops) {

  var self = this;

  async.eachSeries(ops, function (op, next) {

    var tag = op.ns.split('.');

    if (tag[1] === metadata && tag[2]) {
      // 定義が変更されていれば再読み込み
      trigger_map[ tag[0] ] = {};
      getTriggerData(tag[0], trigger_map[ tag[0] ], function (err) {
        next();
      });
    } else {
      next();
    }

  }, function (err) {
    self.emit('data', ops);
  });
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

function StemFilter() {
  this.piped = false;
  this.writable = true;
}

util.inherits(StemFilter, FilterBase);

StemFilter.prototype.write = function (ops) {
  var self = this;

  async.eachSeries(ops, function (op, next) {

    var tag = op.ns.split('.');
    async.eachSeries(Object.keys(trigger_func), function (key, done) {
      trigger_func[ key ].execute(op, tag, function (err) {
        done(err);
      });
    }, function (err) {
      next();
    });

  }, function (err) {
    self.emit('data', ops);
  });
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

tasks.push(function (conn, next) {

  var stream = conn.collection('oplog.rs').find({}, { tailable: true }).stream();

  var filter0 = new Filter0(now);
  var filter1 = new Filter1();
  var filter = new StemFilter();

  stream.pipe(filter0).pipe(filter1).pipe(filter);

});


async.waterfall(tasks, function (err) {
  if (err) {
    console.log(err);
  }
});

function url(ip, port, db) {
  return 'mongodb://' + ip + ':' + port + '/' + db;
}

