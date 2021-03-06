// Case 1
print("------- Case 1 -------");

db.metadata.userinfos.drop();
db.metadata.userinfos.insert({referrer: {db: 'test', collection: 'test_messages', field: 'userinfo_reads'}, 
  master: {collection: 'test_additions', fields: {target: 'messageId', user: 'uid', value: 'read'}, map: "{\"0\":false,\"1\":true}", default: false}});
sleep(300);

db.test_messages.drop();
db.test_messages.insert({"_id" : ObjectId("534263c5641ab7e4020ec20b")});
db.test_additions.drop();
db.test_additions.insert({"messageId" : "534263c5641ab7e4020ec20b", "read" : "1", "uid" : '533e710586ab971418ac1025' });

sleep(400);

var message0 = db.test_messages.findOne({"_id" : ObjectId("534263c5641ab7e4020ec20b")}, {'userinfo_reads':1});
var message1 = { "_id" : ObjectId("534263c5641ab7e4020ec20b"), "userinfo_reads" : [ { "_id" : ObjectId("533e710586ab971418ac1025"), "v" : true } ] };
assert.eq.automsg(message0, message1);




// Case 2 値が'1'以外
print("------- Case 2 -------");

db.metadata.userinfos.drop();
db.metadata.userinfos.insert({referrer: {db: 'test', collection: 'test_messages', field: 'userinfo_reads'}, 
  master: {collection: 'test_additions', fields: {target: 'messageId', user: 'uid', value: 'read'}, map: "{\"0\":false,\"1\":true}", default: false}});
sleep(300);

db.test_messages.drop();
db.test_messages.insert({"_id" : ObjectId("534263c5641ab7e4020ec20b")});
db.test_additions.drop();
db.test_additions.insert({"messageId" : "534263c5641ab7e4020ec20b", "read" : "0", "uid" : '533e710586ab971418ac1025' });

sleep(400);

var message0 = db.test_messages.findOne({"_id" : ObjectId("534263c5641ab7e4020ec20b")}, {'userinfo_reads':1});
var message1 = { "_id" : ObjectId("534263c5641ab7e4020ec20b"), "userinfo_reads" : [ { "_id" : ObjectId("533e710586ab971418ac1025"), "v" : false } ] };
assert.eq.automsg(message0, message1);




// Case 3 追加でなくて変更の場合
print("------- Case 3 -------");

db.metadata.userinfos.drop();
db.metadata.userinfos.insert({referrer: {db: 'test', collection: 'test_messages', field: 'userinfo_reads'},
  master: {collection: 'test_additions', fields: {target: 'messageId', user: 'uid', value: 'read'}, map: "{\"0\":false,\"1\":true}", default: false}});
sleep(300);

db.test_messages.drop();
db.test_messages.insert({"_id" : ObjectId("534263c5641ab7e4020ec20b")});
db.test_additions.drop();
db.test_additions.insert({"messageId" : "534263c5641ab7e4020ec20b", "read" : "0", "uid" : '533e710586ab971418ac1025' });

sleep(200);

db.test_additions.update({"messageId" : "534263c5641ab7e4020ec20b", "uid" : '533e710586ab971418ac1025'}, {$set: {"read" : "1" }});

sleep(400);

var message0 = db.test_messages.findOne({"_id" : ObjectId("534263c5641ab7e4020ec20b")}, {'userinfo_reads':1});
var message1 = { "_id" : ObjectId("534263c5641ab7e4020ec20b"), "userinfo_reads" : [ { "_id" : ObjectId("533e710586ab971418ac1025"), "v" : true } ] };
assert.eq.automsg(message0, message1);




// Case 4 : 集計機能
print("------- Case 4 -------");

db.metadata.userinfos.drop();
db.metadata.userinfos.insert({referrer: {db: 'test', collection: 'test_messages', field: 'userinfo_reads'},
  master: {collection: 'test_additions', fields: {target: 'messageId', user: 'uid', value: 'read'}, map: "{\"0\":false,\"1\":true}", default: false}});
sleep(300);

db.test_messages.drop();
db.test_messages.insert({"_id" : ObjectId("534263c5641ab7e4020ec20b")});
db.test_additions.drop();
db.test_additions.insert({"messageId" : "534263c5641ab7e4020ec20b", "read" : "1", "uid" : '533e710586ab971418ac1025' });
db.test_additions.insert({"messageId" : "534263c5641ab7e4020ec20b", "read" : "1", "uid" : '533e710586ab971418ac1026' });
db.test_additions.insert({"messageId" : "534263c5641ab7e4020ec20b", "read" : "0", "uid" : '533e710586ab971418ac1027' });
db.test_additions.insert({"messageId" : "534263c5641ab7e4020ec20b", "read" : "2", "uid" : '533e710586ab971418ac1028' });
db.test_additions.insert({"messageId" : "534263c5641ab7e4020ec20b", "read" : "3", "uid" : '533e710586ab971418ac1029' });

sleep(400);

var message0 = db.test_messages.findOne({"_id" : ObjectId("534263c5641ab7e4020ec20b")}, {'userinfo_reads_total':1});
var message1 = { "_id" : ObjectId("534263c5641ab7e4020ec20b"), "userinfo_reads_total" : [ {"_id" : false, "value" : 3 }, { "_id" : true, "value" : 2 } ] };
assert.eq.automsg(message0, message1);
