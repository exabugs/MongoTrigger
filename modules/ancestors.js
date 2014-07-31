"use strict";

var async = require('async');

//////////////////////////////////////////////////////

var Ancestors = function (connections) {
  this.config = 'ancestors';
  this.connections = connections;
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

  var conn = self.connections[db];
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

module.exports = Ancestors;
