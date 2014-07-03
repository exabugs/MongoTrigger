MongoTrigger
============

Trigger implementation for MongoDB.

In the case, De-Normalize on mongo.

### How-To Use

#### Start
```
start.sh
```

#### Stop
```
stop.sh
```

#### Test
```
test.sh
```

### How-To Config

[YourDatabase].metadata.embeddeds
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
