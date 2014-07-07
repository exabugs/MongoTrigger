MongoTrigger
============

Trigger implementation for MongoDB.

In the case, De-Normalize on mongo.

### How-To Use

#### Set Up MongoDB Replication ( for OpLog )

mongod.conf
```
replSet=test
```

mongo
```
> config = {
  _id : "test",
  members : [
    { _id : 0, host : "127.0.0.1:27017" }
  ] }

> rs.initiate(config)
```

#### Trigger Start
```
start.sh
```

#### Trigger Stop
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
