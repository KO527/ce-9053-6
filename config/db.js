var mongoose = require("mongoose");
module.exports = {
    connect: connect,
    disconnect: disconnect
};

function connect(cb){
    mongoose.connect(process.env.CONN);
    mongoose.connection.once("open", function(){
        cb();
    });
}

function disconnect(cb){
    //mongoose.disconnect(cb);
    mongoose.disconnect(function(){
        cb();
    });
}