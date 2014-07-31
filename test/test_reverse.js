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
