export {};
import { format } from 'date-fns'
const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const path = require('path')
const jwt = require('jsonwebtoken');
const config = require('../config/default.json'); 
const bcrypt = require("bcrypt");
const Profile = require('../models/profile.model.ts');
const Program = require('../models/programs.model.ts');
const aws        = require('aws-sdk');
const fs         = require('fs');


interface newProfile {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
}
interface Token {
  email: string,
  firstName: string,
  lastName: string,
}

function createToken(token: Token) {
    return jwt.sign(
      { 
        email: token.email, 
        firstName: token.firstName,
        lastName: token.lastName,
      }, config.jwtSecret, {
        expiresIn: 200 // 86400 expires in 24 hours
      });
}
function changeEmailCode(newEmail: string, oldEmail: string, req: any, res: any) {
    const changeEmailOptionsOld = {
      from: 'info@finalbossar.com', 
      to: oldEmail, 
      subject: 'Change Email',
      html:
      `
        <h1>Final Boss Studios</h1>
        <p>This is an email to inform you that your 
        FinalBossAR.com Profile's email has changed to: ${newEmail}.
        
        If you have not changed this yourself, please update
         your password and/or contact us @ contactus@finalbossar.com
        </p>
        `
    };
    const changeEmailOptionsNew = {
      from: 'info@finalbossar.com', 
      to: newEmail, 
      subject: 'Change Email',
      html:
      `
        <h1>Final Boss Studios</h1>
        <p>This is an email to inform you that your 
        FinalBossAR.com Profile has been successfully updated.
        `
    };
  
      var transporter =  nodemailer.createTransport({
        service: 'hotmail',
        auth: {
              user: 'admin@finalbossar.com',
              pass: process.env.PASS,
          },
          debug: true, // show debug output
          logger: true // log information in console
      });
    
      transporter.sendMail(changeEmailOptionsOld, function (err: any, info: any) {
        if(err) {
          console.log(err)
          return res.status(400).json(err);
        }
        else {
          console.log(info);
          console.log('Email sent to Final Boss Admin');
        }
      });
      transporter.sendMail(changeEmailOptionsNew, function (err: any, info: any) {
        if(err) {
          console.log(err)
          return res.status(400).json(err);
        }
        else {
          console.log(info);
          console.log('Email sent to Final Boss Admin');
          return res.status(200).send("Send Email to user");
        }
      });
}
function generateCode(length: number) {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;

  for ( let i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  // console.log('Generated Code: ' + result);
  return result;
}

// Configures AWS settings relative to S3
aws.config.update({
  secretAccessKey: process.env.AWS_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_ID,
  region: 'us-east-2'
});

// Creates a S3 instances
const s3 = new aws.S3();

// counter for picture storage file names
// appends a prefix of 00+counter+00+ to Date.now()_profile-picture for filenames.
var counter = 1;

exports.registerProfile = (req: any, res: any) => {
    console.log('Attemtping to Register Profile (Server)');
    console.log(req.body);
    console.log(req.file);
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let password = req.body.password;
    let dateRegistered = format(Date.now(), "MMMM do, yyyy");
  
    // Check if all info is in request.
    if(!firstName || !lastName || !email || !password || !req.file) {
      return res.status(400).json({msg: "Make sure all fields are filled out!"})
    }

    // Check and see if Profile already exists
    Profile.findOne(
        {email: email},
        async (err: Error, profile: newProfile) => {
            if(err) {
                return res.status(400).json({ 'msg': err });
            }
            if(profile) {
                console.log(profile);
                return res.status(400).json({ msg: 'The Profile already exists with this email' });
            } else {
                // Create S3 Object
                // source = full path of uploaded file
              // example : profile-picture-uploads/1588052734468_profile-picture
              // targetName = filename of uploaded file
  
              console.log('preparing to profile picture upload...');
  
              // Increase counter and append its number to each filename every time the uploadProfilePicture method is called.
              if (counter >= 1 ) {
                ++counter;
                console.log('Counter: ' + counter)
              }
  
              // Read the file, upload the file to S3, then delete file from the directory 'profile-picture-uploads'.
              await fs.readFile( req.file.path, ( err: any, filedata: any ) => {
  
              if (!err) {
                //  Creates Object to be stored in S3
                const putParams = {
                  Bucket      : process.env.S3_BUCKET_NAME,
                  Key         : req.file.filename,
                  Body        : filedata,
                  ACL   : 'public-read'
                };
              
                s3.putObject(putParams, function(err: any, data: any){
                  if (err) {
                    console.log('Could not upload the file. Error :', err);
                    return res.send({success:false});
                    }
                  else {
                    console.log('Data from uploading to S3 Bucket: ');
                    console.log(data);
    
                    let objectUrl = process.env.AWS_URL+req.file.filename;
    
                    // Remove file from profile-picture-uploads directory
                    fs.unlink(req.file.path, async () => {
                      console.log('Successfully uploaded the file. ' + req.file.path + ' was deleted from server directory');
                      console.log(objectUrl)

                    // Create Profile Object
                    let newProfile = await Profile({
                      firstName,
                      lastName,
                      email,
                      dateRegistered,
                      password,
                      profilePicture: objectUrl
                    });

                    // Save Object
                    await newProfile.save((err: Error, newProfile: newProfile) => {
                        if (err) {
                            console.log(err)
                            return res.status(400).json({ 'msg': err });
                        }
                        if (!newProfile) {
                            console.log('There was no profile saved!')
                            return res.status(400).json({ msg: 'There was no profile saved!' });
                        }
                        console.log('Profile registered!');
                        return res.status(200).json(newProfile);
                        });
                  });
                  }
                })
              }

              })
        }
      })
}
exports.sendRegisterCode = (req: any, res: any) => {
  console.clear();
  console.log('Sending Registration Code');
  console.log(req.body);

  let code = req.body.code;
  let email = req.body.email;

  if(!code || !email) {
    console.log('There was either no Code or Email in the Request!');
    return res.status(400).json({msg: "There was either no Code or Email in the Request!"})
  }

  // Set transport service which will send the emails
  // TODO: Need email from Journi to send to.  
  var transporter =  nodemailer.createTransport({
    service: 'hotmail',
    auth: {
          user: '',
          pass: process.env.PASS,
      },
      debug: true, // show debug output
      logger: true // log information in console
  });

//  configuration for email details
// TODO: Need email from Journi to send to. 
// TODO: Need Journi Logo in AWS S3. 
 const mailOptions = {
  from: '', // sender address
  to: `${email}`, // list of receivers
  subject: 'Journi Registration Code',
  html:  `
    <img src="">
    <h3 style="
      font-size: 1.4em;
      color: #888;
    ">Here is your 4 digit code</h3>
    <p style="font-size: 1.4em;">Please use this code on the website to complete your registration: </p>
    
    <p style="
      background: #330474;
      border-radius: 100px;
      width: 200px;
      color: #fff;
      padding: 0.5em;
      text-align: center;
      font-size: 2em;
      letter-spacing: 11px;">${code}</p>`,
  };

 transporter.sendMail(mailOptions, function (err: any, info: any) {
  if(err) {
    console.log(err)
    return res.status(400).json(err);
  }
  else {
    console.log(info);
    return res.status(200).json(info)
  }
 });

}
exports.loginProfile = (req: any, res: any) => {
    console.log(req.body);
    let email = req.body.email;
    let password = req.body.password;
    let stayLoggedIn = req.body.stayLoggedIn;
  
    // Check if all info is in request.
    if(!email || !password) {
      return res.status(400).json({msg: "There was No Email or No Password in the Request!"})
    }
  
    Profile.findOne({ email: req.body.email }, (err: Error, profile: any) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
  
        if (!profile) {
            return res.status(400).json({ 'msg': 'The Profile does not exist' });
        }
  
        profile.comparePassword(req.body.password, (err: Error, isMatch: Boolean) => {
            if (isMatch && !err) {
                console.log(`isMatch = ${isMatch}`)
                console.log('Logged in as: ' + profile.email);

                if(stayLoggedIn) {
                  return res.status(200).json({
                      msg: 'Profile @' + profile.email + ' has logged in / Staying logged in.',
                      token: createToken(profile),
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      email: profile.email,
                      dateRegistered: profile.dateRegistered
                  });
                  
                } else {
                  return res.status(200).json({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    email: profile.email,
                    dateRegistered: profile.dateRegistered
                });
                };
            } else {
                return res.status(400).json({ msg: 'The email and password don\'t match.' });
            }
        });
    });
}
exports.updateName = (req: any, res: any ) => {
    console.log('Attempting to change Profile name...')
    console.log(req.body);
  
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let password = req.body.password;

    if (!password) {
        res.status(400).send('Needs a password')
    } else {
  
        console.log('Finding Profile ...')
        // Find Profile, compare password, then update email.
        Profile.findOne({ email: email}, (err: any, profile: any) => {

          let filter = {email: email};
          let update = { 
            firstName: firstName,
            lastName: lastName,

          };

          if (err) return res.status(400).send({ 'msg': err });
          if (!profile) return res.status(400).json({ msg: 'The Profile does not exist' });
          if (profile.firstName == '' ) update.firstName = profile.firstName;
          if (profile.lastName == '' ) update.lastName = profile.lastName;
          
          console.log('Comparing passwords ...')
          profile.comparePassword(password, (err: any, isMatch: any) => {
            if (isMatch && !err) {
              console.log('Passwords matched!');
              
              // Update Name
              Profile.updateOne(filter, update)
              .then( (data: any) => {
                console.log('Updated FullName:' + JSON.stringify(data));
                return res.status(200).json({
                  firstName,
                  lastName
                });
              })
              .catch( (err: any) => {
                console.log(err);
                return res.status(400).send(err);
              })
            } else {
              console.log('Wrong Password');
              return res.status(400).json({ msg: 'Wrong Password' });
            }
          })
        })
      }
}
exports.updateProfilePicture = (req: any, res: any ) => {
    console.log('Attempting to Update Profile Picture...')
    console.log(req.body);
    console.log(req.file);
    let email = req.body.email;
    let password = req.body.password;

    Profile.findOne(
      {email: email},
      (err: any, profile: any) => {
        profile.comparePassword(password, async (err: any, isMatch: any) => {
          if(err) {
            console.log(err);
            return res.status(400).json(err);
          }
          if(isMatch) {
    
            console.log('preparing to profile picture upload...');
        
            // Increase counter and append its number to each filename every time the uploadProfilePicture method is called.
            if (counter >= 1 ) {
              ++counter;
              console.log('Counter: ' + counter)
            }
        
            // Read the file, upload the file to S3, then delete file from the directory 'profile-picture-uploads'.
            await fs.readFile( req.file.path, ( err: any, filedata: any ) => {
        
            if (!err) {
              //  Creates Object to be stored in S3
              const putParams = {
                Bucket      : process.env.S3_BUCKET_NAME,
                Key         : req.file.filename,
                Body        : filedata,
                ACL   : 'public-read'
              };
            
              s3.putObject(putParams, function(err: any, data: any){
                if (err) {
                  console.log('Could not upload the file. Error :', err);
                  return res.send({success:false});
                  }
                else {
                  console.log('Data from uploading to S3 Bucket: ');
                  console.log(data);
        
                  let objectUrl = process.env.AWS_URL+req.file.filename;
        
                  // Remove file from profile-picture-uploads directory
                  fs.unlink(req.file.path, async () => {
                    console.log('Successfully uploaded the file. ' + req.file.path + ' was deleted from server directory');
                    console.log(objectUrl)
        
                    Profile.updateOne(
                      {email: email},
                      {profilePicture: objectUrl},
                      {new: true},
                      async (err: any, profile: any) => {
                        if(err) return err;
                        if(!profile) return err;
                        if(profile) {
                          return res.status(200).json(true)
                        }
                      })
        
                });
                }
              })
            }
        
            })
          }
        });
      }
    )
}
exports.updateEmail = (req: any, res: any) => {
    console.log('Attempting to change Profile email...')
    console.log(req.body);
  
    let email = req.body.email;
    let newEmail = req.body.newEmail;
    let password = req.body.password;

    if (!newEmail) {
        console.log('No Email!');
        return res.status(400).send('Request needs an new email email');
    } 
    
    if(!password) {
      console.log('No Password!');
      return res.status(400).send('Request needs a password');
    }
      else {
        
        Profile.findOne({ email: email}, (err: any, profile: any) => {
          console.log('Finding Profile ...');
          if (err) return res.status(400).send({msg: err });
          if (!profile) return res.status(400).json({msg: 'The Profile does not exist' });
          if (profile.email === newEmail) return res.status(400).json({msg: 'Please enter an email that is different than your current one.'});

          let filter = { email: email };
          let update = { email: newEmail};
  
          console.log('Comparing passwords ...')
          profile.comparePassword(password, (err: any, isMatch: any) => {
            if (isMatch && !err) {
              console.log('Passwords matched!');

              // TODO: Send user email
              // changeEmailCode(newEmail, email, req, res);
              
              Profile.updateOne(filter, update)
              .then( (data: any) => {
                console.log('Updated Email:' + JSON.stringify(data));
                return res.status(200).send(isMatch);
              })
              .catch( (err: any) => {
                console.log(err);
                return res.status(400).send(err);
              })
            } else {
              console.log('Wrong Password');
              return res.status(400).json({ msg: 'Wrong Password' });
            }
          })
        })
      }
}
exports.updatePassword = (req: any, res: any ) => {
    console.clear();
    console.log('Attempting to change Profile password...')
    console.log(req.body);
  
    let email = req.body.email;
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;

    if (!email || !newPassword) {
        res.status(400).send('Needs email, new password, and old password')
    } else {
  
        console.log('Finding Profile ...')

        // Find Profile, compare password, then update email.
        Profile.findOne({ email: email}, (err: any, profile: any) => {
          if (err) {
            return res.status(400).send({ 'msg': err });
          }
  
          if (!profile) {
            return res.status(400).json({ 'msg': 'The Profile does not exist' });
          }

  
          console.log(profile);
          console.log('Comparing passwords ...');
          // Check to see if newPassword is the same as the old one.
          profile.comparePassword(newPassword, (err: any, isMatch: any) => {

            if (!isMatch && !err) {
  
              // Create new hashed password
              bcrypt.genSalt(10, (err: any, salt: any) => {
  
                if (err) return (err);
                bcrypt.hash(newPassword, salt, (err: any, hash: string) => {
                  
                  console.log('New Password Hashed: ' + hash);
                  let filter = { email: email };
                  let update = { password: hash }
  
                  Profile.findOneAndUpdate(
                    filter, 
                    update,
                    (err: any, profile: any) => {
                      if (err) return err;
                      if(!profile) throw Error('No Profile with that email');
                      console.log('Updated Password: ' + JSON.stringify(profile));
                      return res.status(200).send('Password Updated!');

                    })
                    // .then( (data: any) => {
                    //   return res.status(200).send(isMatch);
                    // })
                    // .catch( (err: any) => {
                    //   console.log(err);
                    //   return res.status(400).end('There was an error');
                    // })
                });
              })
            } else {
              console.log(isMatch);
              return res.status(400).json({msg: 'Cannot have previously used password!'});
            }
          })
        })
      }
}
exports.forgotChangePassword = (req: any, res: any ) => {
    console.clear();
    console.log('Attempting to change Profile password...')
    console.log(req.body);
  
    let email = req.body.email;
    let newPassword = req.body.newPassword;

    if (!email || !newPassword) {
        res.status(400).send('Needs email, new password, and old password')
    } else {
  
        console.log('Finding Profile ...')

        // Find Profile, compare password, then update email.
        Profile.findOne({ email: email}, (err: any, profile: any) => {
          if (err) {
            return res.status(400).send({ 'msg': err });
          }
  
          if (!profile) {
            return res.status(400).json({ 'msg': 'The Profile does not exist' });
          }

  
          console.log(profile);
          console.log('Comparing passwords ...');
          // Check to see if newPassword is the same as the old one.
          profile.comparePassword(newPassword, (err: any, isMatch: any) => {

            if (!isMatch && !err) {
  
              // Create new hashed password
              bcrypt.genSalt(10, (err: any, salt: any) => {
  
                if (err) return (err);
                bcrypt.hash(newPassword, salt, (err: any, hash: string) => {
                  
                  console.log('New Password Hashed: ' + hash);
                  let filter = { email: email };
                  let update = { password: hash }
  
                  Profile.findOneAndUpdate(
                    filter, 
                    update,
                    (err: any, profile: any) => {
                      if (err) return err;
                      if(!profile) throw Error('No Profile with that email');
                      console.log('Updated Password: ' + JSON.stringify(profile));
                      return res.status(200).send(isMatch);

                    })
                    // .then( (data: any) => {
                    //   return res.status(200).send(isMatch);
                    // })
                    // .catch( (err: any) => {
                    //   console.log(err);
                    //   return res.status(400).end('There was an error');
                    // })
                });
              })
            } else {
              console.log(isMatch);
              return res.status(400).json({msg: 'Cannot have previously used password!'});
            }
          })
        })
      }
}
exports.forgotEmailValidation = (req: any, res: any ) => {
  console.log('Attempting Forgot Code & Email Validation...')
  console.log(req.body);

  let email = req.body.email;
  let code = generateCode(4);

  if (!email) {
      res.status(400).send('Needs email.')
  } else {

      console.log('Finding Profile ...');
      console.log(code);
      // Find Profile, compare password, then update email.
      Profile.findOne({ email: email}, (err: any, Profile: any) => {
        if (err) {
          return res.status(400).send({ 'msg': err });
        }

        if (!Profile) {
          return res.status(400).json({ msg: 'The Profile does not exist' });
        }
        // Set transport service which will send the emails
        var transporter =  nodemailer.createTransport({
          service: 'hotmail',
          auth: {
                user: 'admin@finalbossar.com',
                pass: process.env.PASS,
            },
            debug: true, // show debug output
            logger: true // log information in console
        });
      
      //  configuration for email details
       const mailOptions = {
        from: 'register@finalbossar.com', // sender address
        to: `${email}`, // list of receivers
        subject: 'FinalBossAR Forgot Password Code',
        html:
        `
          <h1>FinalBoss AR</h1>
          <div style="width: 100px; height: 100px; background: lightgreen; text-align: center;">
            <p style="padding-top: 3em;">Logo</p>
          </div>
          <h3 style="
            font-size: 1.4em;
            color: #888;
          ">Here is your 4 digit code</h3>
          <p style="font-size: 1.4em;">Please use this code on the website to complete your forgot password process: </p>
          
          <p style="
            background: #dedede;
            border-radius: 100px;
            border: 2px solid #3cf63c;
            width: 200px;
            color: #3cf63c;
            padding: 0.5em;
            text-align: center;
            font-size: 2em;
            letter-spacing: 11px;">${code}</p>`,
        };
      
       transporter.sendMail(mailOptions, function (err: any, info: any) {
        if(err) {
          console.log(err)
          return res.status(400).json({msg: "There was an error sending code to email.", err});
        }
        else {
          console.log(info);
          return res.status(200).json({code})
        }
       });
      })

    }
}
exports.getUserProfile = (req: any, res: any) => {
  let email = req.body.email;
  console.log('Attempting to get User\'s profile information...')
  Profile.findOne(
    {email: email},
    (err: Error, profile: any) => {
      if(err) res.status(401).json(err);
      if(!profile) res.status(400).json({msg: 'No Profile with that Email'});
      if(profile) res.status(200).json(profile);
    }
  )
}
exports.getFavoritePrograms = (req: any, res: any) => {
  let email = req.body.email;
  console.log(`Attempting to get ${email}'s' a favorite programs ...`);
  Profile.findOne(
      {email: email},
      (err: Error, profile: any) => {
        if(err) res.status(401).json(err);
        if(!profile) res.status(400).json({msg: 'No Favori Array found! Check Program Model'});
        if(profile) {
          if(profile.length == 0) console.log('No programs found.');
          console.log('Favorite Programs:');
          console.log(profile.favoritePrograms);
          return res.status(200).json(profile.favoritePrograms)
        };
      }
  );
}
exports.favoriteProgram = (req: any, res: any) => {
  let programID = req.body._id;
  let email = req.body.email;
  console.log('Attempting to Favorite a Program ...')
  Program.findOne(
      {_id: programID},
      (err: Error, program: any) => {
        if(err) {
          console.log(err);
          res.status(401).json(err);
        }
        if(!program) res.status(400).json({msg: 'No Programs Array found! Check Program Model'});
        if(program) {
          if(program.length == 0) console.log('No programs found.');

          Profile.findOne(
            {email},
            (err: Error, profile: any) => {
              if(err) res.status(401).json(err);
              if(!profile) res.status(400).json({msg: 'No Profile found!'});

              let alreadyFavorited = false;
              
              profile.favoritePrograms.forEach((a: any) => {
                if(a._id == programID) {
                  alreadyFavorited = true;
                } 
              });

              if(alreadyFavorited) {
                console.log('This program was already favorited.');
                return res.status(400).json({msg: 'There is already a program favorited with this _id'})
              }
              console.log('This program is able to be favorited ...');
              
               // Add program to favorites
               Profile.findOneAndUpdate(
                {email},
                { $push: {favoritePrograms: program._id}},
                {new: true},
                (err: Error, profile: any) => {
                  if(err) res.status(401).json(err);
                  if(!profile) res.status(400).json({msg: 'No Profile found!'});
                  if(profile) {
                    if(profile.length == 0) console.log('No programs found.');
                    console.log('Favorited Program!');
                    console.log(profile.favoritePrograms);
                    return res.status(200).json(profile.favoritePrograms)
                  };
                }
              );

            }
          ) 
        };
      }
);
}
exports.unfavoriteProgram = (req: any, res: any) => {
  let programID = req.body._id;
  let email = req.body.email;
  console.log('Attempting to UNFavorite a Program ...')
  Program.findOne(
      {_id: programID},
      (err: Error, program: any) => {
        if(err) res.status(401).json(err);
        if(!program) res.status(400).json({msg: 'No Programs Array found! Check Program Model'});
        if(program) {
          if(program.length == 0) console.log('No programs found.');

          // delete program from favorites
          Profile.findOneAndUpdate(
           {email},
           { $pull: {favoritePrograms: program._id}},
           {new: true},
           (err: Error, profile: any) => {
             if(err) res.status(401).json(err);
             if(!profile) res.status(400).json({msg: 'No Profile found!'});
             if(profile) {
               if(profile.length == 0) console.log('No programs found.');
               console.log('Favorited Program!');
               console.log(profile.favoritePrograms);
               return res.status(200).json(profile.favoritePrograms)
             };
           }
              );
        };
      }
);
}
