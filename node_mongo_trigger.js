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

// Trigger Definition
var trigger_data = {};
var trigger_func = {
  ancestors: do_ancestors,
  embeddeds: do_embeddeds
};


var now = Math.ceil((new Date()).getTime() / 1000);

var connections = {};

var tasks = [];

tasks.push(function (next) {
  async.eachSeries(dbs, function (name, done) {
    trigger_data[ name ] = trigger_data[ name ] || {};
    var config = url('127.0.0.1', mongos_port, name);
    MongoClient.connect(config, function (err, db) {
      connections[ name ] = db;
      getTriggerData(name, function (err) {
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
function getTriggerData(name, callback) {
  async.eachSeries(Object.keys(trigger_func), function (key, done) {
    var coll = [metadata, key].join('.');
    connections[ name ].collection(coll).find().toArray(function (err, docs) {
      trigger_data[ name ][ key ] = docs;
      done(err);
    });
  }, function (err) {
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
    if (tag[1] !== '$cmd') {

      this.ops.push(op);

      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
      }

      var self = this;
      this.timeoutId = setTimeout(function () {
        self.timeoutId = 0;
        self.emit('data', self.ops);
        self.ops = [];
      }, 200);
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
    trigger_data[ tag[0] ] = trigger_data[ tag[0] ] || {};

    if (tag[1] === metadata && tag[2]) {
      // 定義が変更されていれば再読み込み
      getTriggerData(tag[0], function (err) {
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
      if (trigger_data[ tag[0] ]) {
        var data = trigger_data[ tag[0] ][ key ];
        if (data) { // null, undefined, empty array
          trigger_func[ key ](op, tag, data, function (err) {
            done(err);
          });
        } else {
          done(null);
        }
      } else {
        done(null);
      }
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

//////////////////////////////////////////////////////

function do_ancestors(op, tag, infos, callback) {
  var done = false;
  async.eachSeries(infos, function (info, next) {
    if (info.collection === tag[1]) {
      update_ancestors(tag[0], op, info, function (err) {
        done = true;
        next(err);
      });
    } else {
      next(null);
    }
  }, function (err) {
    return callback(err, done);
  });
}

function update_ancestors(db, op, info, callback) {
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

  get_ancestors(conn, info, select, o[field], function (err, parent_ancestors) {
    get_ancestors(conn, info, select, _id, function (err, myself_ancestors) {
      var length = myself_ancestors.length - 1;
      var condition = {};
      condition[ info.ancestors ] = { $in: [ _id ] };
      collection.find(condition, select).toArray(function (err, objects) {
        async.eachSeries(objects, function (object, next) {
          var ancestors = object.ancestors || [];
          ancestors = parent_ancestors.concat(ancestors.slice(length));
          update(collection, object._id, info.ancestors, ancestors, function (err) {
            next(err);
          });
        }, function (err) {
          callback(err);
        });
      });
    });
  });
}

function get_ancestors(conn, info, fields, _id, callback) {
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
          get_ancestors(conn, info, fields, object[ info.parent ], function (err, parent_ancestors) {
            ancestors = parent_ancestors.concat(object._id);
            return update(collection, object._id, info.ancestors, ancestors, function (err) {
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
}

function update(collection, _id, key, value, callback) {
  var object = {};
  object[ key ] = value;
  collection.update({ _id: _id }, { $set: object }, function (err, result) {
    return callback(err, result);
  });
}

//////////////////////////////////////////////////////

function do_embeddeds(op, tag, infos, callback) {
  var done = false;
  if (op.o2 === undefined) {
    return callback(null, done);
  } else {
    async.eachSeries(infos, function (info, next) {
      if (info.master.collection === tag[1]) {
        var master = get_master(op.o, info);
        if (master) {
          var referrer = get_referrer(op.o2, info);
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
}

function get_master(data, info) {
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
}

function get_referrer(data, info) {
  if (!data._id) return null;
  var obj = info.referrer.condition ? info.referrer.condition : {};
  obj[ [info.referrer.field, '_id'].join('.') ] = data._id;
  return obj;
}
