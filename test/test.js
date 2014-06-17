// db.stop.insert({});

// Case 1
print("------- Case 1 -------");

db.metainfo.drop();
db.users.drop();
db.documents.drop();

db.metainfo.insert({referrer: {collection: 'documents', field: 'author', multi: false}, master: {collection: 'users', fields: ['name', 'age']}});
db.users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: 'sakurai',  age: 42});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: {"_id" : ObjectId("539c511fb2980377adc224cd")}});
db.users.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"name": 'sakurai2'}});

sleep(100);

var document0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name":1});
var document1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":{"name":"sakurai2"}};
assert.eq.automsg(document0, document1);



// Case 2
// フィールド名がドットを含む場合
print("------- Case 2 -------");

db.metainfo.drop();
db.users.drop();
db.documents.drop();

db.metainfo.insert({referrer: {collection: 'documents', field: 'author', multi: true}, master: {collection: 'users', fields: ['name.first', 'age']}});
db.users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: {last: 'sakurai', first: 'hajime'}, age: 42});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});
db.users.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"name.first": 'hajime2'}});

sleep(100);

var document0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name.first":1});
var document1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":[{"name":{"first":"hajime2"}}]};
assert.eq.automsg(document0, document1);


// Case 3
// 配列型で複数のレコードが更新対象の場合
print("------- Case 3 -------");

db.metainfo.drop();
db.users.drop();
db.documents.drop();

db.metainfo.insert({referrer: {collection: 'documents', field: 'author', multi: true}, master: {collection: 'users', fields: ['name.first', 'age']}});
db.users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: {last: 'sakurai', first: 'hajime'}, age: 42});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224cb"), title: 'doc2', author: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224cc"), title: 'doc3', author: [{"_id" : ObjectId("539c511fb2980377adc224ce")}]});
db.users.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"name.first": 'hajime2'}});

sleep(100);

var doc1_0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name.first":1});
var doc1_1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":[{"name":{"first":"hajime2"}}]};
assert.eq.automsg(doc1_0, doc1_1);

var doc2_0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224cb")}, {"author.name.first":1});
var doc2_1 = {"_id":ObjectId("539c511fb2980377adc224cb"), "author":[{"name":{"first":"hajime2"}}]};
assert.eq.automsg(doc2_0, doc2_1);

var doc3_0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224cc")}, {"author.name.first":1});
var doc3_1 = {"_id":ObjectId("539c511fb2980377adc224cc"), "author" : [{}] };
assert.eq.automsg(doc3_0, doc3_1);



// Case 4
// _id ではない検索条件を指定した場合
print("------- Case 4 -------");

db.metainfo.drop();
db.users.drop();
db.documents.drop();

db.metainfo.insert({referrer: {collection: 'documents', field: 'author', multi: false}, master: {collection: 'users', fields: ['name', 'age']}});
db.users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: 'sakurai',  age: 42});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: {"_id" : ObjectId("539c511fb2980377adc224cd")}});
db.users.update({"age" : 42}, {$set: {"name": 'sakurai2'}});

sleep(100);

var document0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name":1});
var document1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":{"name":"sakurai2"}};
assert.eq.automsg(document0, document1);



// Case 5
print("------- Case 5 -------");

db.metainfo.drop();
db.groups.drop();
db.documents.drop();

db.metainfo.insert({referrer: {collection: 'documents', field: 'groups', multi: true}, master: {collection: 'groups', fields: ['name', 'parents']}});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: 'develop', parents: [
ObjectId("539c511fb2980377adc224cd"),
ObjectId("539c511fb2980377adc224ce"),
ObjectId("539c511fb2980377adc224cf")
]});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', groups: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});

db.groups.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"parents": [
ObjectId("539c511fb2980377adc224cf"),
ObjectId("539c511fb2980377adc224ce"),
ObjectId("539c511fb2980377adc224cd")
]}});
sleep(100);
var doc0 = db.documents.findOne({"_id": ObjectId("539c511fb2980377adc224ca")}, {"groups.parents":1});
var doc1 = { "_id" : ObjectId("539c511fb2980377adc224ca"), "groups" : [ { "parents" : [ ObjectId("539c511fb2980377adc224cf"), ObjectId("539c511fb2980377adc224ce"), ObjectId("539c511fb2980377adc224cd") ] } ] }
assert.eq.automsg(doc0, doc1);

