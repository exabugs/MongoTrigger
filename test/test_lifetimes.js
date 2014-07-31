
// embeddeds は削除
db.metadata.embeddeds.drop();

// db.stop.insert({});

// Case 1
print("------- Case 1 -------");
db.metadata.lifetimes.drop();
db.metadata.lifetimes.insert({"referrer" : {"collection" : "test_messages" }, "master" : {"collection" : "test_cards"}});
sleep(300);
db.test_messages.drop();
db.test_cards.drop();
db.test_cards.insert({"_id" : "card_A", name: 'sakurai',  age: 42});

sleep(400);

var document0 = db.test_messages.findOne({"_id" : "card_A"});
var document1 = {"_id": "card_A"};
assert.eq.automsg(document0, document1);


db.test_cards.remove({"_id" : "card_A"});
sleep(400);
var document0 = db.test_messages.findOne({"_id" : "card_A"});
assert.eq.automsg(document0, null);


// Case 2 EmbeddedsとLifetimesの合わせ技
print("------- Case 2 -------");
db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: "test_messages", field: "" }, master : {collection: "test_cards", fields: ['name', 'age']}});
db.metadata.lifetimes.drop();
db.metadata.lifetimes.insert({"referrer" : {"collection" : "test_messages" }, "master" : {"collection" : "test_cards"}});
sleep(300);
db.test_messages.drop();
db.test_cards.drop();
db.test_cards.insert({"_id" : "card_A", name: 'sakurai',  age: 42});

sleep(600);

var document0 = db.test_messages.findOne({"_id" : "card_A"});
var document1 = { "_id" : "card_A", "name" : "sakurai", "age" : 42 };
assert.eq.automsg(document0, document1);




// Case 3 条件をつける場合
print("------- Case 3 -------");
db.metadata.embeddeds.drop();
db.metadata.embeddeds.insert({referrer: {collection: "test_messages", field: "" }, master : {collection: "test_cards", fields: ['name']}});
db.metadata.lifetimes.drop();
db.metadata.lifetimes.insert({"referrer" : {"collection" : "test_messages" }, "master" : {"collection" : "test_cards", condition: {valid: true} }});
sleep(300);
db.test_messages.drop();
db.test_cards.drop();
db.test_cards.insert({"_id" : "card_A", name: 'sakurai_A',  valid: true});
db.test_cards.insert({"_id" : "card_B", name: 'sakurai_B',  valid: false});

sleep(600);

var document0 = db.test_messages.findOne({"_id" : "card_A"});
var document1 = { "_id" : "card_A", "name" : "sakurai_A" };
assert.eq.automsg(document0, document1);


var document0 = db.test_messages.findOne({"_id" : "card_B"});
var document1 = null;
assert.eq.automsg(document0, document1);
