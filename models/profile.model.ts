export {};
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const ProfileSchema: any = new mongoose.Schema(
    {
      firstName: {
        type: String,
        maxlength: 40,
      },
      lastName: {
        type: String,
        maxlength: 40,
      },
      email: {
        type: String,
        maxlength: 100,
      },
      dateRegistered: {
        type: String,
        maxlength: 100,
      },
      password: {
        type: String,
      }
  });

  // Called before save method on the model
  // Turns user entered password into a hash value, with salt
  ProfileSchema.pre('save', function(this: any, next: any){
      // had to use a regular function ^ to get the correct scope of 'this'.
      var user = this;
      if (!user.isModified('password')) return next();
    
      bcrypt.genSalt(10, (err: Error, salt: any) => {
        if (err) return next(err);
    
        bcrypt.hash(user.password, salt, (err: Error, hash: any) => {
          if (err) return next(err);
          if(hash) {
            console.log(`Salt: ${salt}`);
            user.password = hash;
            this.password = user.password;
            console.log('Password Hashed');
            console.log(user.password);
            return next();
          }
        })
      })
  })

  ProfileSchema.methods.comparePassword = function(candidatePassword: any, cb: any) {
          bcrypt.compare(candidatePassword, this.password, (err: Error, isMatch: Boolean) => {
            // console.log('Password: ' + candidatePassword);
            // console.log('Hashed Password: ' + this.password);
            // console.log('Passwords Match: ' + isMatch);
            if (err) return cb(err);
            cb(null, isMatch);
          })
  }
        
  //custom method to generate authToken
  ProfileSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id }, config.get('myprivatekey')); //get the private key from the config file -> environment variable
    return token;
  }
  
  const Profile = mongoose.model('Profile', ProfileSchema);
  module.exports = Profile;