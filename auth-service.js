const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
mongoose.set("debug", true);

var userSchema = new Schema({
    "userName": {
        "type": String,
        "unique": true
    },
    "password" : String,
    "email" : String,
    "loginHistory" : [{
        "dateTime" : Date,
        "userAgent" : String
    }]
})

let User; // to be defined on new connection (see initialize)

function initialize(){
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://sanjaybrijesh:Newpassword123@senecaweb.phmcbo0.mongodb.net/web322_week8?retryWrites=true&w=majority");
        
        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};

function registerUser(userData){
    return new Promise((resolve,reject)=>{
        if (userData.password == userData.password2){
            bcrypt.hash(userData.password, 10).then(hash=>{ // Hash the password using a Salt that was generated using 10 rounds
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save().then(()=>{resolve();}).catch((err)=>{
                    if (err.code == 11000){
                        reject("User Name already taken");
                    }
                    else{
                        reject("There was an error creating the user: " + err);
                    }
                })
            })
            .catch(err=>{
                console.log("Error encrypting password: "+ err); // Show any errors that occurred during the process
            });

            
        }
        else{
            
            reject('Passwords do not match');
        }

    })
}

function checkUser(userData){
    return new Promise((resolve,reject)=>{

        User.find({ userName: userData.userName }).exec()
        .then((users)=>{
            if(users.length == 0){
                reject("Unable to find user: "+ userData.userName);
            }
            bcrypt.compare(userData.password,users[0].password ).then((result) => {
            // result === true if it matches and result === false if it does not match
                if (result == false){
                    reject("Incorrect Password for user: "+ userData.userName);
                }
                else{
                users[0].loginHistory.push({dateTime : (new Date()).toString(), userAgent : userData.userAgent});
                
                User.updateOne(
                    {userName : users[0].userName},
                    { $set: {loginHistory : users[0].loginHistory}}
                ).exec().then(()=>{resolve(users[0]);})
                    .catch((err) =>{reject("There was an error verifying the user: " + err)});

            }

            });

            // if(users[0].password != userData.password){
            //     reject("Incorrect Password for user: "+ userData.userName);
            // }
            
        }).catch((err) =>{reject("Unable to find user: " + userData.userName )});
    })
}

module.exports = {
    initialize: initialize,
    registerUser:registerUser,
    checkUser: checkUser

}