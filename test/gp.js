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

db.categories.insert( { _id: "MongoDB", ancestors: [ "Books", "Programming", "Databases", "MongoDB" ], parent: "Databases" } )
db.categories.insert( { _id: "dbm", ancestors: [ "Books", "Programming", "Databases", "dbm" ], parent: "Databases" } )
db.categories.insert( { _id: "Databases", ancestors: [ "Books", "Programming", "Databases" ], parent: "Programming" } )
db.categories.insert( { _id: "Languages", ancestors: [ "Books", "Programming", "Language" ], parent: "Programming" } )
db.categories.insert( { _id: "Programming", ancestors: [ "Books", "Programing" ], parent: "Books" } )
db.categories.insert( { _id: "Books", ancestors: [ "Books" ], parent: null } )

db.metadata.ancestors.insert({collection: 'categories', parent: 'parent', ancestors: 'ancestors'});
// db.books.insert( { _id: "Book", categories: [ { _id: "MongoDB" } ] } )

db.categories.update( {_id: "MongoDB"}, {$set: {parent: "Languages"}});
db.categories.update( {_id: "dbm"}, {$set: {parent: "MongoDB"}});



// Case 2 ancestors
// ルートから(親から)順に登録するなら、ancestorsは自動生成。
print("------- Case 2 ancestors -------");

db.metadata.ancestors.drop();
db.metadata.ancestors.insert({collection: 'categories', parent: 'parent', ancestors: 'ancestors'});

db.categories.drop();
db.categories.insert( { _id: "Books",       parent: null          } );
db.categories.insert( { _id: "Programming", parent: "Books"       } );
db.categories.insert( { _id: "Databases",   parent: "Programming" } );
db.categories.insert( { _id: "Languages",   parent: "Programming" } );
db.categories.insert( { _id: "MongoDB",     parent: "Databases"   } );
db.categories.insert( { _id: "dbm",         parent: "Databases"   } );

db.categories.update( {_id: "MongoDB"}, {$set: {parent: "Languages"}});
db.categories.update( {_id: "dbm"}, {$set: {parent: "MongoDB"}});
