"use strict";

var async = require('async');
var events = require('events');
var stream = require('stream');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;

var direct_port = 27017;
var mongos_port = 27017;

var dbs = ['test', 'test1', 'test2'];

var metadata = 'metadata';


//////////////////////////////////////////////////////

var Ancestors = function () {
  this.infos = {};
};

Ancestors.prototype.map = function (db, map) {
  this.infos[ db ].forEach(function (info) {
    map[ [ db, info.collection ].join('.') ] = 1;
  });
};

Ancestors.prototype.execute = function (op, tag, callback) {
  var self = this;
  var done = false;
  async.eachSeries(self.infos[ tag[0] ], function (info, next) {
    if (info.collection === tag[1]) {
      self.update_ancestors(tag[0], op, info, function (err) {
        done = true;
        next(err);
      });
    } else {
      next(null);
    }
  }, function (err) {
    return callback(err, done);
  });
};

Ancestors.prototype.update_ancestors = function (db, op, info, callback) {
  var self = this;
  var field = info.parent;
  if (op.op === 'i' && op.o[ info.ancestors ]) {
    return callback(null);
  }
  var o = op.o['$set'] || op.o;
  if (!o[field]) {
    return callback(null);
  }

  var conn = connections[db];
  var collection = conn.collection(info.collection);
  var select = {};
  select[ info.ancestors ] = 1;

  var _id = op.o2 ? op.o2._id : o._id;

  self.get_ancestors(conn, info, select, o[field], function (err, parent_ancestors) {
    self.get_ancestors(conn, info, select, _id, function (err, myself_ancestors) {
      var length = myself_ancestors.length - 1;
      var condition = {};
      condition[ info.ancestors ] = { $in: [ _id ] };
      collection.find(condition, select).toArray(function (err, objects) {
        async.eachSeries(objects, function (object, next) {
          var ancestors = object.ancestors || [];
          ancestors = parent_ancestors.concat(ancestors.slice(length));
          self.update(collection, object._id, info.ancestors, ancestors, function (err) {
            next(err);
          });
        }, function (err) {
          callback(err);
        });
      });
    });
  });
};

Ancestors.prototype.get_ancestors = function (conn, info, fields, _id, callback) {
  var self = this;
  if (!_id) {
    return callback(null, []);
  } else {
    fields = fields || {};
    fields[ info.ancestors ] = 1;
    var collection = conn.collection(info.collection);
    collection.findOne({ _id: _id }, fields, function (err, object) {
      if (object) {
        var ancestors = object[ info.ancestors ];
        if (!ancestors) {
          self.get_ancestors(conn, info, fields, object[ info.parent ], function (err, parent_ancestors) {
            ancestors = parent_ancestors.concat(object._id);
            return self.update(collection, object._id, info.ancestors, ancestors, function (err) {
              callback(err, ancestors);
            });
          });
        } else {
          return callback(null, ancestors);
        }
      } else {
        return callback(null, []);
      }
    });
  }
};

Ancestors.prototype.update = function (collection, _id, key, value, callback) {
  var object = {};
  object[ key ] = value;
  collection.update({ _id: _id }, { $set: object }, function (err, result) {
    return callback(err, result);
  });
};

//////////////////////////////////////////////////////

var Embeddeds = function () {
  this.infos = {};
};

Embeddeds.prototype.map = function (db, map) {
  this.infos[ db ].forEach(function (info) {
//  map[ [ db, info.referrer.collection ].join('.') ] = 1; // referrer は不要
    map[ [ db, info.master.collection ].join('.') ] = 1;
  });
};

Embeddeds.prototype.execute = function (op, tag, callback) {
  var self = this;
  var done = false;
  if (op.o2 === undefined) {
    return callback(null, done);
  } else {
    async.eachSeries(self.infos[ tag[0] ], function (info, next) {
      if (info.master.collection === tag[1]) {
        var master = self.get_master(op.o, info);
        if (master) {
          var referrer = self.get_referrer(op.o2, info);
          if (referrer) {
            var conn = connections[info.referrer.db || tag[0]];
            conn.collection(info.referrer.collection).update(referrer, { $set: master }, { multi: true }, function (err, result) {
              done = true;
              next(null);
            });
          } else {
            next(null);
          }
        } else {
          next(null);
        }
      } else {
        next(null);
      }
    }, function (err) {
      callback(err, done);
    });
  }
};

Embeddeds.prototype.get_master = function (data, info) {
  var obj = {};
  var fields = info.master.fields;
  var referrer_field = info.referrer.multi ? [info.referrer.field, '$'].join('.') : info.referrer.field;
  var update = false;
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var o = data['$set'] || data;
    if (!o[field]) continue;
    obj[ [referrer_field, field].join('.') ] = o[field];
    update = true;
  }
  return update ? obj : null;
};

Embeddeds.prototype.get_referrer = function (data, info) {
  if (!data._id) return null;
  var obj = info.referrer.condition ? info.referrer.condition : {};
  obj[ [info.referrer.field, '_id'].join('.') ] = data._id;
  return obj;
};

//////////////////////////////////////////////////////////////////////////////////////////

// Trigger Definition
var trigger_func = {
  ancestors: new Ancestors(),
  embeddeds: new Embeddeds()
};

var trigger_map = {};

var now = Math.ceil((new Date()).getTime() / 1000);

var connections = {};

var tasks = [];

tasks.push(function (next) {
  async.eachSeries(dbs, function (name, done) {
    var config = url('127.0.0.1', mongos_port, name);
    MongoClient.connect(config, function (err, db) {
      connections[ name ] = db;
      trigger_map[ name ] = {};
      getTriggerData(name, trigger_map[ name ], function (err) {
        done(err)
      });
    });
  }, function (err) {
    next(err);
  });
});

/**
 *
 * @param name DB名称
 * @param callback
 */
function getTriggerData(name, map, callback) {
  async.eachSeries(Object.keys(trigger_func), function (key, done) {
    var coll = [ metadata, key ].join('.');
    connections[ name ].collection(coll).find().toArray(function (err, docs) {
      trigger_func[ key ].infos[ name ] = docs;
      trigger_func[ key ].map(name, map);
      done(err);
    });
  }, function (err) {
    console.log( JSON.stringify(trigger_map));
    callback(err);
  });
}

tasks.push(function (next) {
  var config = url('127.0.0.1', direct_port, 'local');
  MongoClient.connect(config, function (err, conn) {
    next(err, conn);
  });
});


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

});

function url(ip, port, db) {
  return 'mongodb://' + ip + ':' + port + '/' + db;
}

