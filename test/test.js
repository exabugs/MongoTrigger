// db.stop.insert({});

// Case 1
print("------- Case 1 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'author', multi: false}, master: {collection: 'test_users', fields: ['name', 'age']}});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: 'sakurai',  age: 42});
db.documents.drop();
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: {"_id" : ObjectId("539c511fb2980377adc224cd")}});
db.test_users.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"name": 'sakurai2'}});

sleep(400);

var document0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name":1});
var document1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":{"name":"sakurai2"}};
assert.eq.automsg(document0, document1);



// Case 2
// フィールド名がドットを含む場合
print("------- Case 2 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'author', multi: true}, master: {collection: 'test_users', fields: ['name.first', 'age']}});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: {last: 'sakurai', first: 'hajime'}, age: 42});
db.documents.drop();
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});
db.test_users.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"name.first": 'hajime2'}});

sleep(400);

var document0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name.first":1});
var document1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":[{"name":{"first":"hajime2"}}]};
assert.eq.automsg(document0, document1);


// Case 3
// 配列型で複数のレコードが更新対象の場合
print("------- Case 3 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'author', multi: true}, master: {collection: 'test_users', fields: ['name.first', 'age']}});
sleep(300)
db.test_users.drop();
db.test_users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: {last: 'sakurai', first: 'hajime'}, age: 42});
db.documents.drop();
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224cb"), title: 'doc2', author: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224cc"), title: 'doc3', author: [{"_id" : ObjectId("539c511fb2980377adc224ce")}]});
db.test_users.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"name.first": 'hajime2'}});

sleep(400);

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

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'author', multi: false}, master: {collection: 'test_users', fields: ['name', 'age']}});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: 'sakurai',  age: 42});
db.documents.drop();
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: {"_id" : ObjectId("539c511fb2980377adc224cd")}});
db.test_users.update({"age" : 42}, {$set: {"name": 'sakurai2'}});

sleep(400);

var document0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name":1});
var document1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":{"name":"sakurai2"}};
assert.eq.automsg(document0, document1);



// Case 5
print("------- Case 5 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'groups', multi: true}, master: {collection: 'groups', fields: ['name', 'parents']}});
sleep(300);
db.groups.drop();
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: 'develop', parents: [
ObjectId("539c511fb2980377adc224cd"),
ObjectId("539c511fb2980377adc224ce"),
ObjectId("539c511fb2980377adc224cf")
]});
db.documents.drop();
db.documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', groups: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});

db.groups.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"parents": [
ObjectId("539c511fb2980377adc224cf"),
ObjectId("539c511fb2980377adc224ce"),
ObjectId("539c511fb2980377adc224cd")
]}});
sleep(400);
var doc0 = db.documents.findOne({"_id": ObjectId("539c511fb2980377adc224ca")}, {"groups.parents":1});
var doc1 = { "_id" : ObjectId("539c511fb2980377adc224ca"), "groups" : [ { "parents" : [ ObjectId("539c511fb2980377adc224cf"), ObjectId("539c511fb2980377adc224ce"), ObjectId("539c511fb2980377adc224cd") ] } ] }
assert.eq.automsg(doc0, doc1);


// Case 6
// 親フォルダの権限を子供のファイルが継承する場合
print("------- Case 6 -------");


db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'folders', multi: true}, master: {collection: 'folders', fields: ['name', 'parents']}});
sleep(300);
db.folders.drop();
db.folders.insert({"_id" : "C", name: 'develop', parents: [ "A", "B", "C" ]});

db.documents.drop();
db.documents.insert({"_id" : "Book-X", title: 'Book-X', folders: [{"_id" : "C"}]});

db.folders.update({"_id" : "C"}, {$set: {"parents": [ "A", "B", "D", "C"]}});
sleep(400);
var doc0 = db.documents.findOne({"_id": "Book-X"}, {"folders.parents":1});
var doc1 = { "_id" : "Book-X", "folders" : [ { "parents" : [ "A", "B", "D", "C" ] } ] }
assert.eq.automsg(doc0, doc1);


// Case 7
// embeddedsに条件がつく場合
print("------- Case 7 -------");


db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'folders', multi: true, condition: {type: 0}}, master: {collection: 'folders', fields: ['name', 'parents']}});
sleep(300);
db.folders.drop();
db.folders.insert({"_id" : "C", name: 'develop', parents: [ "A", "B", "C" ]});

db.documents.drop();
db.documents.insert({"_id" : "Book-X", title: 'Book-X', folders: [{"_id" : "C"}], type: 0});
db.documents.insert({"_id" : "Book-Y", title: 'Book-Y', folders: [{"_id" : "C"}], type: 1});

db.folders.update({"_id" : "C"}, {$set: {"parents": [ "A", "B", "D", "C"]}});
sleep(400);
var doc0 = db.documents.findOne({"_id": "Book-X"}, {"folders.parents":1});
var doc1 = { "_id" : "Book-X", "folders" : [ { "parents" : [ "A", "B", "D", "C" ] } ] };
assert.eq.automsg(doc0, doc1);

var doc20 = db.documents.findOne({"_id": "Book-Y"}, {"folders.parents":1});
var doc21 = { "_id" : "Book-Y", "folders" : [ {  } ] };
assert.eq.automsg(doc20, doc21);

// Case 8
// DBが異なる場合
print("------- Case 8 -------");

use test;
db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {db: 'test2', collection: 'documents', field: 'author', multi: false}, master: {collection: 'test_users', fields: ['name', 'age']}});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : "sakurai", name: 'sakurai',  age: 42});

use test2;
db.documents.drop();
db.documents.insert({"_id" : "doc1", title: 'doc1', author: {"_id" : "sakurai"}});

use test;
db.test_users.update({"_id" : "sakurai"}, {$set: {"name": 'sakurai2'}});

sleep(400);

use test2;
var document0 = db.documents.findOne({"_id" : "doc1"}, {"author.name":1});
var document1 = {"_id": "doc1", "author":{"name":"sakurai2"}};
assert.eq.automsg(document0, document1);



// Case 9
// まったく同じコピーが欲しい場合 (referrerのfieldが''の場合)
print("------- Case 9 -------");

use test;
db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'test_users_copy', field: '', multi: false}, master: {collection: 'test_users', fields: ['name', 'age']}});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : "sakurai", name: 'sakurai',  age: 42});

db.test_users_copy.drop();
db.test_users_copy.insert({"_id" : "sakurai"});

db.test_users.update({"_id" : "sakurai"}, {$set: {"name": 'sakurai2'}});

sleep(400);

var document0 = db.test_users_copy.findOne({"_id" : "sakurai"}, {name:1});
var document1 = {"_id": "sakurai", "name":"sakurai2"};
assert.eq.automsg(document0, document1);






// Case 10
print("------- Case 10 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'author', multi: false},
  master: {collection: 'test_users', fields: ['name', 'age'], map: "{\"name\":\"name.first\"}" }});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : "sakurai", name: 'sakurai',  age: 42});
db.documents.drop();
db.documents.insert({"_id" : "doc1", title: 'doc1', author: {"_id" : "sakurai"}});
db.test_users.update({"_id" : "sakurai"}, {$set: {"name": 'sakurai2'}});

sleep(400);

var document0 = db.documents.findOne({"_id" : "doc1"}, {"author.name":1});
var document1 = { "_id" : "doc1", "author" : { "name" : { "first" : "sakurai2" } } };
assert.eq.automsg(document0, document1);



// Case 11 上位のフィールドを指定して、下位がダイレクトに変更された場合
print("------- Case 11 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'documents', field: 'author', multi: false}, master: {collection: 'test_users', fields: ['name', 'age']}});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : "user_1", name: {"last": 'sakurai'},  age: 42});
db.documents.drop();
db.documents.insert({"_id" : "doc_1", title: 'doc1', author: {"_id" : "user_1"}});
db.test_users.update({"_id" : "user_1"}, {$set: {"name.last": 'sakurai2'}});

sleep(400);

var document0 = db.documents.findOne({"_id" : "doc_1"}, {"author.name":1});
var document1 = {"_id": "doc_1", "author":{"name": {"last":"sakurai2"}}};
assert.eq.automsg(document0, document1);
