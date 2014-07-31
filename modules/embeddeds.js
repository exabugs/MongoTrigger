"use strict";

var async = require('async');
var util = require('./util');

//////////////////////////////////////////////////////

var Embeddeds = function (connections) {
  this.config = 'embeddeds';
  this.connections = connections;
  this.infos = {};
};

Embeddeds.prototype.map = function (db, map) {
  this.infos[ db ].forEach(function (info) {
//  map[ [ db, info.referrer.collection ].join('.') ] = 1; // referrer は不要
    map[ [ db, info.master.collection ].join('.') ] = 1;

    var convert = util.hash(info.master.fields);
    info.master.map= util.hash(info.master.map, convert);
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
            var conn = self.connections[info.referrer.db || tag[0]];
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
    var _field = info.master.map[field];
    _field = referrer_field ? [referrer_field, _field].join('.') : _field;
    obj[_field] = o[field];
    update = true;
  }
  return update ? obj : null;
};

Embeddeds.prototype.get_referrer = function (data, info) {
  if (!data._id) return null;
  var obj = info.referrer.condition ? info.referrer.condition : {};
  var _field = info.referrer.field ? [info.referrer.field, '_id'].join('.') : '_id';
  obj[_field] = data._id;
  return obj;
};

module.exports = Embeddeds;
