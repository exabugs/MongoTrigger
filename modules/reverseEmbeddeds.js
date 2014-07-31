"use strict";

var async = require('async');
var util = require('./util');

//////////////////////////////////////////////////////

var ReverseEmbeddeds = function (connections) {
  this.config = 'embeddeds';
  this.connections = connections;
  this.infos = {};
};

ReverseEmbeddeds.prototype.map = function (db, map) {
  this.infos[ db ].forEach(function (info) {
    // embeddeds は master をチェックするが、
    // reverseEmbeddeds は、referrer をチェックする
    map[ [ db, info.referrer.collection ].join('.') ] = 1;

    var convert = util.hash(info.master.fields);
    info.master.map= util.hash(info.master.map, convert);
  });
};

/**
 *
 * @param op
 * @param tag
 * @param callback
 *
 * [insert]
 * op.op='i'
 * op.o={ _id: xxx }
 * op.o2=undefined
 *
 * [delete] 無視
 * op.op='d'
 *
 * [update]
 * op.op='u'
 * op.o= { name: hello }
 * op.o2={ _id: xxxx }
 */
ReverseEmbeddeds.prototype.execute = function (op, tag, callback) {
  var self = this;
  var done = false;

  if (op.op === 'd') {
    return callback(null, done);
  } else {
    var conn = self.connections[ tag[0] ]; // master DB
    async.eachSeries(self.infos[ tag[0] ], function (info, next) {
      if (info.referrer.collection === tag[1]) {
        self.get_master(conn, op.o, info, function (err, master) {
          if (master) {
            var referrer = self.get_referrer(op.o2 || op.o, info);
            if (referrer) {
              var conn = self.connections[ info.referrer.db || tag[0] ];
              conn.collection(info.referrer.collection).update(referrer, { $set: master }, function (err, result) {
                done = true;
                next(null);
              });
            } else {
              next(null);
            }
          } else {
            next(null);
          }
        });
      } else {
        next(null);
      }
    }, function (err) {
      callback(err, done);
    });
  }

};

ReverseEmbeddeds.prototype.get_master = function (conn, data, info, callback) {

  var fields = info.master.fields;
  var referrer_field = info.referrer.field;

  // 新規追加
  // 配列操作($addToSet, $pull) の場合は $setになる。
  data = data['$set'] || data;

  var object = (referrer_field === '') ? data : util.getValue(data, referrer_field);
  if (!object) {
    return callback(null, null);
  }

  var targets = [];
  if (object instanceof Array) {
    for (var i = 0; i < object.length; i++) {
      targets[i] = { _id: object[i]['_id'], index: i };
    }
  } else {
    targets[0] = { _id: object['_id'] };
  }

  var master = {};
  var collection = conn.collection(info.master.collection);
  async.each(targets, function (target, next) {
    if (target._id) {
      collection.findOne({ _id: target._id }, { fields: hash(fields) }, function (err, result) {
        if (!err && result) {
          for (var i = 0; i < fields.length; i++) {
            var keys = (referrer_field === '') ? [] : [ referrer_field ];
            if (target.index !== undefined)
              keys.push(target.index);
            keys.push(info.master.map[fields[i]]);

            master[ keys.join('.') ] = util.getValue(result, fields[i]);
          }
        }
        next(err);
      });
    } else {
      next()
    }
  }, function (err) {
    callback(err, master);
  });

};

function hash(array) {
  var _fields = {};
  for (var i = 0; i < array.length; i++) {
    _fields[ array[i] ] = 1;
  }
  return _fields;
}

ReverseEmbeddeds.prototype.get_referrer = function (data, info) {
  if (!data._id) return null;
  var obj = info.referrer.condition || {};
  obj._id = data._id;
  return obj;
};

module.exports = ReverseEmbeddeds;

/*

 [直接ID書き換え]

 db.books.update({ "_id" : ObjectId("53d8e167d13d1425c09b4a21")},
 {$set:{"categories.1._id": "hello2"}})

 op.o
 $set
 categories.1._id = "hello2"


 [オブジェクト新規追加]

 db.books.insert({'categories':[{'_id': "Languages"},{"_id" : "Databases"}]})

 op.o
 categories = [
 { _id: "Languages" },
 { _id: "Databases" }
 ]

 [配列に追加]
 db.books.update({ "_id" : ObjectId("53d8e167d13d1425c09b4a21")},
 {$addToSet:{"categories": {_id: "hello world"}}})

 op.o
 $set
 categories = [
 { _id: "Languages" },
 { _id: "Databases" },
 { _id: "hello world" }
 ]

 [配列から削除]
 db.books.update({ "_id" : ObjectId("53d8e167d13d1425c09b4a21")},
 {$pull:{"categories": {_id: "hello world"}}})

 op.o
 $set
 categories = [
 { _id: "Languages" },
 { _id: "Databases" }
 ]
 */


/*
 テストケース

 (配列かどうかは、定義ではなくて、実際の値を見て判断している)

 単数の場合
 db.books.insert({'categories':{'_id': "Languages"}})

 配列の場合
 db.books.insert({'categories':[{'_id': "Languages"},{"_id" : "Databases"}]})
 */