db.metadata.lifetimes.drop();

// db.stop.insert({});

// Case 1
print("------- Case 1 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'test_books', field: 'category'}, master: {collection: 'test_categories', fields: ['ancestors', 'parent']}});
sleep(300);
db.test_categories.drop();
db.test_categories.insert({"_id" : "Books",       parent: null, ancestors: ["Books"]});
db.test_categories.insert({"_id" : "Programming", parent: 'Books', ancestors: ["Books","Programming"]});
db.test_categories.insert({"_id" : "Databases",   parent: 'Programming', ancestors: ["Books","Programming","Databases"]});
db.test_books.drop();
db.test_books.insert({"_id" : "A", 'category':{'_id': "Programming"}})

sleep(400);

var document0 = db.test_books.findOne({"_id" : "A"}, {"category":1});
var document1 = { "_id" : "A", "category" : { "_id" : "Programming", "ancestors" : [ "Books", "Programming" ], "parent" : "Books" } };
assert.eq.automsg(document0, document1);




// Case 2 referrerが複数形(配列)の場合
print("------- Case 2 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'test_books', field: 'categories'}, master: {collection: 'test_categories', fields: ['ancestors', 'parent']}});
sleep(300);
db.test_categories.drop();
db.test_categories.insert({"_id" : "Books",       parent: null, ancestors: ["Books"]});
db.test_categories.insert({"_id" : "Programming", parent: 'Books', ancestors: ["Books","Programming"]});
db.test_categories.insert({"_id" : "Databases",   parent: 'Programming', ancestors: ["Books","Programming","Databases"]});
db.test_books.drop();
db.test_books.insert({"_id" : "A", 'categories': [{'_id': "Programming"}, {'_id': "Databases"}]})

sleep(400);

var document0 = db.test_books.findOne({"_id" : "A"}, {"categories":1});
var document1 = { "_id" : "A", "categories" : [ { "_id" : "Programming", "ancestors" : [ "Books", "Programming" ], "parent" : "Books" }, { "_id" : "Databases", "ancestors" : [ "Books", "Programming", "Databases" ], "parent" : "Programming" } ] };
assert.eq.automsg(document0, document1);




// Case 3 referrerが複数形(配列)で、「追加」した場合
print("------- Case 3 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'test_books', field: 'categories'}, master: {collection: 'test_categories', fields: ['ancestors', 'parent']}});
sleep(300);
db.test_categories.drop();
db.test_categories.insert({"_id" : "Books",       parent: null, ancestors: ["Books"]});
db.test_categories.insert({"_id" : "Programming", parent: 'Books', ancestors: ["Books","Programming"]});
db.test_categories.insert({"_id" : "Databases",   parent: 'Programming', ancestors: ["Books","Programming","Databases"]});
db.test_books.drop();
db.test_books.insert({"_id" : "A", 'categories': [{'_id': "Programming"}]})
//db.test_books.insert({"_id" : "A", 'categories': [{'_id': "Programming"}, {'_id': "Databases"}]})

sleep(400);

var document0 = db.test_books.findOne({"_id" : "A"}, {"categories":1});
var document1 = { "_id" : "A", "categories" : [ { "_id" : "Programming", "ancestors" : [ "Books", "Programming" ], "parent" : "Books" } ] };
assert.eq.automsg(document0, document1);


db.test_books.update({"_id" : "A"}, {$addToSet: {'categories': {'_id': "Databases"}}});

sleep(400);
var document0 = db.test_books.findOne({"_id" : "A"}, {"categories":1});
var document1 = { "_id" : "A", "categories" : [ { "_id" : "Programming", "ancestors" : [ "Books", "Programming" ], "parent" : "Books" }, { "_id" : "Databases", "ancestors" : [ "Books", "Programming", "Databases" ], "parent" : "Programming" } ] };
assert.eq.automsg(document0, document1);




// Case 4 referrerが複数形(配列)で、「削除」した場合
print("------- Case 4 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'test_books', field: 'categories'}, master: {collection: 'test_categories', fields: ['ancestors', 'parent']}});
sleep(300);
db.test_categories.drop();
db.test_categories.insert({"_id" : "Books",       parent: null, ancestors: ["Books"]});
db.test_categories.insert({"_id" : "Programming", parent: 'Books', ancestors: ["Books","Programming"]});
db.test_categories.insert({"_id" : "Databases",   parent: 'Programming', ancestors: ["Books","Programming","Databases"]});
db.test_books.drop();
db.test_books.insert({"_id" : "A", 'categories': [{'_id': "Programming"}, {'_id': "Databases"}]})

sleep(400);

var document0 = db.test_books.findOne({"_id" : "A"}, {"categories":1});
var document1 = { "_id" : "A", "categories" : [ { "_id" : "Programming", "ancestors" : [ "Books", "Programming" ], "parent" : "Books" }, { "_id" : "Databases", "ancestors" : [ "Books", "Programming", "Databases" ], "parent" : "Programming" } ] };
assert.eq.automsg(document0, document1);

// 削除
db.test_books.update({"_id" : "A"}, {$pull: {'categories': {'_id': "Programming"}}});

sleep(400);
var document0 = db.test_books.findOne({"_id" : "A"}, {"categories":1});
var document1 = { "_id" : "A", "categories" : [ { "_id" : "Databases", "ancestors" : [ "Books", "Programming", "Databases" ], "parent" : "Programming" } ] };
assert.eq.automsg(document0, document1);




// Case 5 referrer の field が '' (オブジェクトをそのままコピーする場合)
print("------- Case 5 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'test_categories_copy', field: ''}, master: {collection: 'test_categories', fields: ['ancestors', 'parent']}});
sleep(300);
db.test_categories.drop();
db.test_categories.insert({"_id" : "Books",       parent: null, ancestors: ["Books"]});
db.test_categories.insert({"_id" : "Programming", parent: 'Books', ancestors: ["Books","Programming"]});
db.test_categories_copy.drop();

db.test_categories_copy.insert({"_id" : "Programming"});

sleep(400);

var document0 = db.test_categories_copy.findOne({"_id" : "Programming"});
var document1 = { "_id" : "Programming", "ancestors" : [ "Books", "Programming" ], "parent" : "Books" };
assert.eq.automsg(document0, document1);




// Case 6 フィールド名がドットを含む場合
print("------- Case 6 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'test_documents', field: 'author'}, master: {collection: 'test_users', fields: ['name.first', 'age']}});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: {last: 'sakurai', first: 'hajime'}, age: 42});
db.test_documents.drop();
db.test_documents.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), title: 'doc1', author: [{"_id" : ObjectId("539c511fb2980377adc224cd")}]});
db.test_users.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"name.first": 'hajime2'}});

sleep(400);

var document0 = db.test_documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name.first":1});
var document1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":[{"name":{"first":"hajime2"}}]};
assert.eq.automsg(document0, document1);




// Case 7 フィールド名を別名に変更する場合
print("------- Case 7 -------");

db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: 'test_documents', field: 'author'}, master: {collection: 'test_users', fields: ['name.first', 'age'], map: [['name.first','name.firstname']]}});
sleep(300);
db.test_users.drop();
db.test_users.insert({"_id" : "sakurai", name: {last: 'sakurai', first: 'hajime'}, age: 42});
db.test_documents.drop();
db.test_documents.insert({"_id" : "doc1", title: 'doc1', author: [{"_id" : "sakurai"}]});
db.test_users.update({"_id" : "sakurai"}, {$set: {"name.first": 'hajime2'}});

sleep(400);

var document0 = db.test_documents.findOne({"_id" : "doc1"}, {"author.name":1});
var document1 = { "_id" : "doc1", "author" : [ { "name" : { "firstname" : "hajime2" } } ] };
assert.eq.automsg(document0, document1);
