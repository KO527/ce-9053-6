var mongoose = require("mongoose");

var PersonSchema = new mongoose.Schema({
   name: String,
   things: [{type: mongoose.Schema.ObjectId,
             ref: "Thing"
   }],
   numberOfThings: {
       type: Number, 
       default: 0
   },
   favoritePlaces: [{
       type: mongoose.Schema.ObjectId,
       ref: "Place"
   }],
   numberOfFavoritePlaces: {
       type: Number,
       default: 0
   } 
});

PersonSchema.statics.getOneByName = function(name, cb){
    this.findOne({
        name: name
    }).populate("things").exec(cb);
};

PersonSchema.statics.getOneById = function(id, cb){
    this.findOne({
        _id: id
    }, cb);
};

PersonSchema.statics.getAll = function(cb){
    this.find({}).sort("name").exec(cb);
};

PersonSchema.statics.acquire = function(personId, thingId, cb){
    Thing.findById(thingId, function(err, _thing){
        if (_thing.numberInStock <= 0)
          return cb({
              message: "NONE_IN_STOCK"
          });
          var qry = {
            _id: personId
          };
          var update = {
              $push: {
                  things: thingId
              },
              $inc: {
                  numberOfThings: 1
              }
          };
          Person.update(qry, update, function(err){
              var query = {
                  _id: thingId
              };
              var update = {
                  $inc: {
                      numberOwned: 1,
                      numberInStock: -1
                  }
              }
              Thing.update(query, update, function(){
                  cb();
              });
          });
    });
};


PersonSchema.statics.returnThing = function(personId, thingId, cb){
    this.findById(personId, function(err, _person){
        var index = _person.things.indexOf(thingId);
        if (index == -1)
            return cb({
                message: "USER_DOES_NOT_OWN"
            }, null);
          _person.things.splice(index, 1);
          _person.numberOwned = _person.numberOwned + 1;
          _person.save(function(err){
            var query = {
                _id: thingId
            };
            var update = {
                $inc: {
                    numberOwned: -1,
                    numberInStock: 1
                }
            };
            Thing.update(query, update, function(){
                cb();
            });
        });
    });
};

PersonSchema.statics.findAllWhoFavoritedPlace = function(placeId, cb){
    Place.findById(placeId, function(err, _place){
        var query = Person.find({}).populate("favoritePlaces");
        query.in('Person.favoritePlaces', ['_place.name']);
        query.select('name numberOfFavoritePlaces').exec(function(err, results){});
        cb();
    });
}
PersonSchema.statics.addPlace = function(personId, placeId, cb){
    Person.findById(personId, function(err, _person){
        Place.findById(placeId, function(err, _place){
            if (_person.favoritePlaces.indexOf(_place.name) !== -1){
                cb({
                    message: "Place Already Exists"
                });
            }
            var query = {
                _id: _person
            };
            var update = {
                $inc: {
                    numberOfFavorites: 1
                },
                $push: {
                    favoritePlaces: _place.Id
                }
                }
            Person.update(query, update, function(err, results){
                var qry = {
                    _id: placeId
                }
                var update = {
                    $inc: {
                        numberOfTimesFavorited: 1
                    }
                }
            Place.update(qry, update, function(){
                cb();
            });
            });
        });
    });
}

PersonSchema.statics.removePlace = function(personId, placeId, cb){
    Place.findById(placeId, function(err, _place){
        Person.findById(personId, function(err, _person){
         if(_person.favoritePlaces.indexOf(placeId) == -1){
             cb({
                 message: "Person_Does_Not_Have_Place"
             });
         }
         var update = {
             $pull:{
                 favoritePlaces: _place
             }
         }
         Person.findOneAndUpdate(_person, update, function(err, results){
             cb();
         });
       });
     });
}
var Person = mongoose.model("Person", PersonSchema);

var ThingSchema = new mongoose.Schema({
    name: String,
    numberOwned: {
        type: Number,
        default: 0
    },
    numberInStock: Number
});

ThingSchema.statics.getThingByName = function(name, cb){
    this.findOne({name: name}, cb);
};

ThingSchema.statics.getOneById = function(id, cb){
    this.findById(id, cb);
};

ThingSchema.statics.getAll = function(cb){
    this.find({}).sort("name").exec(cb);
};

var Thing = mongoose.model("Thing", ThingSchema);

var PlaceSchema = new mongoose.Schema({
    name: String, 
    numberOfTimesFavorited: {
        type: Number, 
        default: 0
    }
});

PlaceSchema.statics.getOneByName = function(name, cb){
    this.findOne({name: name}, cb);
}
PlaceSchema.statics.getOneById = function(id, cb){
    this.findOne({id: id}, cb);
};
PlaceSchema.statics.getAll = function(cb){
    this.find({}).sort("name").exec(cb)
};
PlaceSchema.statics.getAllFavoritedPlaces = function(cb){
    this.find({}).where('numberOfTimesFavorited').gt(0).select("name").exec(cb);
};
PlaceSchema.statics.getAllUnfavoritedPlaces = function(cb){
    this.find({}).where('numberOfTimesFavorited').lte(0).select('name').exec(cb);
};

var Place = mongoose.model("Place", PlaceSchema);

function seed(cb){
    var people = [
        {name : "Moe"},
        {name : "Larry"},
        {name: "Curly"}
    ];
    var things = [
        {name: "Rock",
         numberInStock: 10
        },
        {name: "Paper",
         numberInStock: 10
        },
        {name: "Scissors",
         numberInStock: 10
        }
    ];
    var places = [
        {name: "New York"},
        {name : "Paris"}, 
        {name: "London"}
        ];
    Person.remove({}, function(){
        Person.create(people, function(err, moe, larry, curly){
            Thing.remove({}, function(){
                Thing.create(things, function(err, rock, paper, scissors){
                    Place.remove({}, function(){
                       Place.create(places, function(err, ny, paris, ldn){
                            cb(err, moe, larry, curly, rock, paper, scissors, ny, paris, ldn);
                       });
                    });    
                });
            });
        });
    });
}
module.exports = {
    seed: seed,
    Person: Person,
    Thing: Thing,
    Place: Place
};