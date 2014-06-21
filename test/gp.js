// db.stop.insert({});

// metadata.embedded
// metadata.ancestors

// Case 1 ancestors
print("------- Case 1 ancestors -------");

// Model Tree Structures with an Array of Ancestors

// http://docs.mongodb.org/manual/tutorial/model-tree-structures-with-ancestors-array/

// When modified parent, as soon as possible maintain ancestors myself and others.

db.metadata.ancestors.drop();
db.categories.drop();
db.books.drop();

db.categories.insert( { _id: "MongoDB", ancestors: [ "Books", "Programming", "Databases" ], parent: "Databases" } )
db.categories.insert( { _id: "dbm", ancestors: [ "Books", "Programming", "Databases" ], parent: "Databases" } )
db.categories.insert( { _id: "Databases", ancestors: [ "Books", "Programming" ], parent: "Programming" } )
db.categories.insert( { _id: "Languages", ancestors: [ "Books", "Programming" ], parent: "Programming" } )
db.categories.insert( { _id: "Programming", ancestors: [ "Books" ], parent: "Books" } )
db.categories.insert( { _id: "Books", ancestors: [ ], parent: null } )

db.metadata.ancestors.insert({collection: 'books', parent: 'parent', ancestors: 'ancestors'});
db.books.insert( { _id: "Book", categories: [ { _id: "MongoDB" } ] } )

db.categories.update( {_id: "MongoDB"}, {$set: {parent: "Languages"}});
