// db.stop.insert({});


// Case 1 ancestors
print("------- Case 1 ancestors -------");

# Model Tree Structures with an Array of Ancestors

# http://docs.mongodb.org/manual/tutorial/model-tree-structures-with-ancestors-array/

# When modified parent, as soon as possible maintain ancestors myself and others.

db.metainfo.drop();
db.categories.drop();
db.groups.drop();

db.categories.insert( { _id: "MongoDB", ancestors: [ "Books", "Programming", "Databases" ], parent: "Databases" } )
db.categories.insert( { _id: "dbm", ancestors: [ "Books", "Programming", "Databases" ], parent: "Databases" } )
db.categories.insert( { _id: "Databases", ancestors: [ "Books", "Programming" ], parent: "Programming" } )
db.categories.insert( { _id: "Languages", ancestors: [ "Books", "Programming" ], parent: "Programming" } )
db.categories.insert( { _id: "Programming", ancestors: [ "Books" ], parent: "Books" } )
db.categories.insert( { _id: "Books", ancestors: [ ], parent: null } )

db.metainfo.insert({referrer: {collection: 'books', field: 'categories', multi: true}, master: {collection: 'categories', fields: ['ancestors']}});
db.books.insert( { _id: "Book", categories: [ { _id: "MongoDB" } ] } )

// Case 2 embedded
print("------- Case 2 embedded -------");

db.metainfo.drop();
db.users.drop();
db.groups.drop();
db.documents.drop();

db.metainfo.insert({referrer: {collection: 'documents', field: 'open', multi: true}, master: {collection: 'groups', fields: ['ancestors']}});

db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), parent: null, name: 'group_root'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224cb"), parent: ObjectId("539c511fb2980377adc224ca"), ancestors: [
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_A'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224cc"), parent: ObjectId("539c511fb2980377adc224cb"), ancestors: [
ObjectId("539c511fb2980377adc224cc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_B1'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224dc"), parent: ObjectId("539c511fb2980377adc224cb"), ancestors: [
ObjectId("539c511fb2980377adc224dc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_B2'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), parent: ObjectId("539c511fb2980377adc224cc"), ancestors: [
ObjectId("539c511fb2980377adc224cd"), 
ObjectId("539c511fb2980377adc224cc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_C1'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224dd"), parent: ObjectId("539c511fb2980377adc224dc"), ancestors: [
ObjectId("539c511fb2980377adc224dd"),
ObjectId("539c511fb2980377adc224dc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_C2'});
db.users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), group: ObjectId("539c511fb2980377adc224cb"), name: 'sakurai',  age: 42});
db.documents.insert({"_id" : ObjectId("539c511fb2980377ddc224ca"), open: [
{"_id" : ObjectId("539c511fb2980377adc224dd")}
], title: 'doc1', author: {"_id" : ObjectId("539c511fb2980377adc224cd")}});
db.documents.insert({"_id" : ObjectId("539c511fb2980377ddc224cb"), open: [
{"_id" : ObjectId("539c511fb2980377adc224cc")}
], title: 'doc2', author: {"_id" : ObjectId("539c511fb2980377adc224cd")}});

db.groups.update({"_id" : ObjectId("539c511fb2980377adc224dd")}, {$set: {parent: ObjectId("539c511fb2980377adc224cc"), ancestors:[
ObjectId("539c511fb2980377adc224dd"),
ObjectId("539c511fb2980377adc224cc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
]}});
sleep(100);

var doc0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377ddc224ca")}, {"open.ancestors":1});
var doc1 = { "_id" : ObjectId("539c511fb2980377ddc224ca"), "open" : [ { "ancestors" : [ ObjectId("539c511fb2980377adc224dd"), ObjectId("539c511fb2980377adc224cc"), ObjectId("539c511fb2980377adc224cb"), ObjectId("539c511fb2980377adc224ca") ] } ] }
assert.eq.automsg(doc0, doc1);

var user_group = [ObjectId("539c511fb2980377adc224cb")];
db.documents.find({"open.ancestors": {$in: user_group}}, {_id:1});
//db.documents.find();


