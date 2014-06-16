MongoTrigger
============

Trigger implementation for MongoDB.

[YourDatabase].metainfo
```
{
    "referrer" : {
        "collection" : "documents",
        "field" : "author",
        "multi" : false
    },
    "master" : {
        "collection" : "users",
        "fields" : [ 
            "name", 
            "age"
        ]
    }
}
```
