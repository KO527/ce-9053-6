var models = require("../../models/models");
var Person = models.Person;
var Thing = models.Thing;
var db = require("../../config/db");
describe("models", function(){
    var ids = {};
    beforeEach(function(done){
        db.connect(function(){
            models.seed(function(
                err,
                moe,
                larry,
                curly,
                rock,
                paper,
                scissors,
                ny,
                paris,
                ldn){
                ids.moeId = moe._id;
                ids.larryId = larry._id;
                ids.culyId = curly._id;
                ids.rockId = rock._id;
                ids.paperId = paper._id;
                ids.scissorsId = scissors._id;
                ids.nyId = ny._id;
                ids.parisId = paris._id;
                ids.ldnId = ldn._id;
                done();
            });
        });
    });
    afterEach(function(done){
        db.disconnect(function(){
            done();
        });
    });
    
    describe("Person", function(){
        describe("acquire", function(){
            describe("Moe gets two rocks and piece of paper", function(){
                var things;
                var rockThing;
                var paperThing;
                var person;
                
                var giveMoeTwoRocksAndPairOfScissors = function(cb){
                    Person.acquire(ids.moeId, ids.rockId, function(){
                        Person.acquire(ids.moeId, ids.rockId, function(){
                            Person.acquire(ids.moeId, ids.paperId, function(){
                               cb();
                            });
                        });
                    });
                };


                var getThingsFromMoe = function(moe){
                    return moe.things.map(
                        function(thing){
                            return thing.name;
                        })
                    };
                
                beforeEach(function(done){
                    giveMoeTwoRocksAndPairOfScissors(function(){
                        Thing.getOneByName("Rock", function(err, _thing){
                            rockThing = _thing;
                            Thing.getOneByName("Paper", function(err, _thing){
                                paperThing = _thing;
                                Person.getOneByName("Moe", function(err, _person){
                                    things = getThingsFromMoe(_person)
                                    person = _person;
                                    done();
                                });
                            });
                        });
                    });
                });
                it("Moe has three things", function(){
                    expect(person.things.length).toEqual(3);
                });
                it("Moe's numberOfthings is 3", function(){
                    expect(person.numberOfThings).toEqual(3);
                });
                it("Moe has a two rocks and a paper", function(){
                    expect(things).toEqual(["Rock", "Rock", "Scissors"])
                });
                it("Rock is owned twice", function(){
                    expect(rockThing.numberOwned).toEqual(2);
                });
                it("There are 8 rocks left", function(){
                    expect(rockThing.numberInStock).toEqual(9);
                });
                describe("moe gives back a rock", function(){
                    beforeEach(function(done){
                        Person.returnThing(Ids.moeId, Ids.rockId, function(){
                            Person.getOneByName("Moe", function(){
                                things = getThingsFromMoe(_person);
                                Thing.getOneByName("Rock", function(err, _thing){
                                    rockThing = _Thing;
                                    done();
                                });
                            });
                        });
                    });
                    it("moe has a rock and a piece of paper", function(){
                        expect(things).toEqual(["Rock", "Paper"]);
                    });
                    it("There are now 9 rocks in stock", function(){
                        expect(rockThing.numberInStock).toEqual(8);
                    });
                    it("One Rock is owned", function(){
                        expect(rockThing.numberOwned).toEqual(1);
                    });
                });
                describe("moe gives back paper", function(){
                    var message;
                    beforeEach(function(){
                        Person.returnThing(ids.moeId, ids.scissorsId, function(err){
                            message = err.message;
                            done();
                        });
                    });
                    it("error is thrown", function(){
                        expect(message).toEqual("USER_DOES_NOT_OWN");
                    });
                });
                describe("There is no paper", function(){
                    beforeEach(function(done){
                        Thing.update({
                            _id: ids.paperId
                        },{
                            $set: {
                                numberInStock: 0
                            }
                        }, done);
                });
                describe("Moe attempts to get paper", function(){
                    var message;
                    beforeEach(function(done){
                        Person.acquire(ids.moeId, ids.paperId, function(err){
                            message = err.message;
                            done();
                        });
                    });
                    it("moe doesn't get to own paper", function(){
                        expect(message).toEqual("NONE_IN_STOCK");
                    });
                });
            });
        });
    });
    describe("getPersonByName", function(){
       var person;
       beforeEach(function(done){
           Person.getOneByName("Moe", function(err, _person){
               person = _person;
               done();
            });
        });
   
        it("person is moe", function(){
            expect(person.name).toEqual("Moe");
        });
    });

    describe("getPersonById", function(){
        var person;
        beforeEach(function(done){
            Person.getOneById(ids.moeId, function(err, _person){
                person = _person;
                done();
            });
        });
        it ("returns moe", function(){
            expect(person.name).toEqual("Moe");
        })
    });//end getPersonById

    describe("getAll", function(){
        var people;
        beforeEach(function(done){
           Person.getAll(function(err, _people){
              people = _people.map(function(person){
                  return person.name;
              });
              done();
           });
        });
        it("return [curly, larry, moe]", function(){
            expect(people).toEqual(["Curly", "Larry", "Moe"]);
        });
    });
    
    var MoesFavoritePlaceIsNy = function(cb){
        Person.addPlace(Ids.MoeId, Ids.nyId, function(){
            cb();
        });
    }
    
    describe("findAllWhoFavoritedPlace", function(){
            var people;
            beforeEach(function(done){
            MoesFavoritePlaceIsNy(function(){
                Place.getOneById(Ids.NyId, function(err, _NyPlace){
                    Person.findAllWhoFavoritedPlace(_NyPlace, function(err, _person){
                     people = _person.name;
                    });
                });
            });
        });
        it("MoefavoritedNy", function(){
            expect(people).toEqual("Moe");
        });
        it("There is one place under Moe",function(){
            expect(people.numberOfFavoritePlaces).toEqual(1);
        })
    });
    describe("Moe tries to add Ny", function(){
        var message;
        beforeEach(function(done){
            Person.addplace(Ids.MoeId, Ids.NyId, function(err){
                message = err.message;
                done();
            });
        });
        it("MoeAlreadyFavoritedNy", function(){
           message.toEqual("Place Already Exists"); 
        });
    });

    describe("Moe tries to remove paris", function(){
        var message;
        beforeEach(function(done){
            Person.removePlace(Ids.MoeId, Ids.ParisId, function(err){
                message = err.message
            });
        });
        it("Moe does not have have Paris", function(){
            message.toEqual("Person_Does_Not_Have_Place");
        });
    });
    describe("Moe removes NewYork", function(){
        var NumOfMoeFavs;
        beforeEach(function(done){
            Person.removePlace(Ids.MoeId, Ids.NyId, function(){
               var NumOfMoeFavs = Ids.MoeId.numberOfFavoritePlaces;
            });
        });
        it("Moe has no favPlaces", function(){
           NumOfMoeFavs.toEqual(0); 
        });
    });
});//end of person tests
    describe("Thing", function(){
        describe("getOneByName", function(){
            var thing;
            beforeEach(function(done){
                Thing.getOneByName("Rock", function(err, _thing){
                    thing = _thing;
                    done();
                });
            });
            it("is a rock", function(){
                expect(thing.name).toEqual("Rock");
            });
        });
        describe("getOneById", function(){
            var thing;
            beforeEach(function(done){
                thing.getOneById(ids.rockId, function(err, _thing){
                    thing = _thing;
                    done();
                });
            });
            it("is a rock", function(){
                expect(thing.name).toEqual("Rock");
            });
        });
        describe("getAll", function(){
            var things;
            beforeEach(function(done){
                Thing.getAll(function(err, _things){
                    things = _things.map(function(thing){
                    return thing.name;                        
                    });
                    done();
                });
            });
            it("return [Paper, Rock, Scissors]", function(){
                expect(things).toEqual(["Paper", "Rock", "Scissors"]);
            });
        });
    });//end of Thing
    
    describe("Place", function(){
        describe("getOneByName", function(){
            var place;
            beforeEach(function(done){
                Place.getOneByName("Paris", function(err, _place){
                    place = _place;
                });
            });
        it("Paris exists", function(){
            expect(place.name).toEqual("Paris");
        });
    });
    describe("getOneById", function(){
        var placeId;
        beforeEach(function(done){
            Place.getOneById(Ids.ldnId, function(err, _place){
                placeId = _place;
            });
        });
        it("This is london", function(){
            expect(placeId.name).toEqual("London");
        });
    });
    describe("getAll", function(){
        var places;
        beforeEach(function(done){
            Place.getAll(function(err, _places){
            places = _places.map(function(place){
                    return place.name;
                });
            });
        });
        it("These are the places", function(){
            expect(places).toEqual(["London", "New York", "Paris"]);   
        });
    });
    describe("getAllFavoritedPlaces", function(){
        var AllPlaces;
        var UnfavoritedPlaces = [];
        beforeEach(function(done){
            Person.addPlace(Ids.MoeId, Ids.ParisId, function(){
                   Place.getAllFavoritedPlaces(function(err, results){
                       AllPlaces = results;
                   });
                   Place.getAllUnfavoritedPlaces(function(err, _results){
                      var UnfavoritedPlaces = _results.map(function(result){
                          return result.name;
                      });
                       
                   })
            });
        });
        it("FavoritedPlaces Should Return Paris", function(){
           expect(AllPlaces.name).toEqual("Paris"); 
        });
        it("UnFavoritedPlaces Should return London and New York", function(){
            expect("UnfavoritedPlaces").toEqual(["London", "New York"]);
        });
    });
    
});
});