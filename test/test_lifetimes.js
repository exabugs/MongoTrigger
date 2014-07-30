
// db.stop.insert({});

// Case 1
print("------- Case 1 -------");

db.metadata.lifetimes.drop();
db.metadata.lifetimes.insert({"_id" : ObjectId("53d8707a428094b7d2b01d68"), "referrer" : {"collection" : "test_messages" }, "master" : {"collection" : "test_cards"}});
sleep(300);
db.test_messages.drop();
db.test_cards.drop();
db.test_cards.insert({"_id" : ObjectId("539c511fb2980377adc224cd"), name: 'sakurai',  age: 42});

sleep(400);

var document0 = db.test_messages.findOne({"_id" : ObjectId("539c511fb2980377adc224cd")});
var document1 = {"_id":ObjectId("539c511fb2980377adc224cd")};
assert.eq.automsg(document0, document1);


db.test_cards.remove({"_id" : ObjectId("539c511fb2980377adc224cd")});
sleep(400);
var document0 = db.test_messages.findOne({"_id" : ObjectId("539c511fb2980377adc224cd")});
assert.eq.automsg(document0, null);

