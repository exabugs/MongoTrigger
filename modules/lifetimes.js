"use strict";

var async = require('async');

//////////////////////////////////////////////////////

var Lifetimes = function (connections) {
  this.config = 'lifetimes';
  this.connections = connections;
  this.infos = {};
};

Lifetimes.prototype.map = function (db, map) {
  this.infos[ db ].forEach(function (info) {
    map[ [ db, info.master.collection ].join('.') ] = 1;
  });
};

Lifetimes.prototype.execute = function (op, tag, callback) {
  var self = this;
  var done = false;
  async.eachSeries(self.infos[ tag[0] ], function (info, next) {
    if (info.master.collection === tag[1]) {

      var conn = self.connections[ tag[0] ];
      var collection = conn.collection(info.master.collection);
      var condition = info.master.condition || {};
      condition._id = op.o._id;
      collection.findOne(condition, function (err, result) {
        if (result) {
          self.upsert(tag[0], op, info, function (err) {
            done = true;
            next(err);
          });
        } else {
          next(null);
        }
      });
    } else {
      next(null);
    }
  }, function (err) {
    return callback(err, done);
  });
};

Lifetimes.prototype.upsert = function (db, op, info, callback) {
  var self = this;

  var conn = self.connections[info.referrer.db || db];
  var _id = op.o._id;
  var collection = conn.collection(info.referrer.collection);

  switch (op.op) {
    case 'i':
      collection.insert({_id: _id}, function (err, result) {
        callback(err, result);
      });
      break;
    case 'd':
      collection.remove({_id: _id}, function (err, result) {
        callback(err, result);
      });
      break;
    default:
      callback(null, null);
  }

};

module.exports = Lifetimes;
