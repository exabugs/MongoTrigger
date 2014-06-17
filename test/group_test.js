// db.stop.insert({});

// Case 1
print("------- Case 1 -------");

db.metainfo.drop();
db.users.drop();
db.groups.drop();
db.documents.drop();

db.metainfo.insert({referrer: {collection: 'documents', field: 'open', multi: true}, master: {collection: 'groups', fields: ['parents']}});

db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224ca"), parent: null, name: 'group_root'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224cb"), parent: ObjectId("539c511fb2980377adc224ca"), parents: [
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_A'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224cc"), parent: ObjectId("539c511fb2980377adc224cb"), parents: [
ObjectId("539c511fb2980377adc224cc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_B1'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224dc"), parent: ObjectId("539c511fb2980377adc224cb"), parents: [
ObjectId("539c511fb2980377adc224dc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_B2'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), parent: ObjectId("539c511fb2980377adc224cc"), parents: [
ObjectId("539c511fb2980377adc224cd"), 
ObjectId("539c511fb2980377adc224cc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_C1'});
db.groups.insert({"_id" : ObjectId("539c511fb2980377adc224dd"), parent: ObjectId("539c511fb2980377adc224dc"), parents: [
ObjectId("539c511fb2980377adc224dd"),
ObjectId("539c511fb2980377adc224dc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
], name: 'group_C2'});
db.users.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), group: ObjectId("539c511fb2980377adc224cd"), name: 'sakurai',  age: 42});
db.documents.insert({"_id" : ObjectId("539c511fb2980377ddc224ca"), open: [
{"_id" : ObjectId("539c511fb2980377adc224dd")}
], title: 'doc1', author: {"_id" : ObjectId("539c511fb2980377adc224cd")}});
db.documents.insert({"_id" : ObjectId("539c511fb2980377ddc224cb"), open: [
{"_id" : ObjectId("539c511fb2980377adc224cc")}
], title: 'doc2', author: {"_id" : ObjectId("539c511fb2980377adc224cd")}});

db.users.update({"_id" : ObjectId("539c511fb2980377adc224cd")}, {$set: {"name": 'sakurai2'}});
db.groups.update({"_id" : ObjectId("539c511fb2980377adc224dd")}, {$set: {parent: ObjectId("539c511fb2980377adc224cc"), parents:[
ObjectId("539c511fb2980377adc224dd"),
ObjectId("539c511fb2980377adc224cc"),
ObjectId("539c511fb2980377adc224cb"),
ObjectId("539c511fb2980377adc224ca")
]}});
sleep(100);

//var document0 = db.documents.findOne({"_id" : ObjectId("539c511fb2980377adc224ca")}, {"author.name":1});
//var document1 = {"_id":ObjectId("539c511fb2980377adc224ca"), "author":{"name":"sakurai2"}};
//assert.eq.automsg(document0, document1);



