const express  = require("express");
const router  = express.Router();
const multer     = require('multer');
const fs         = require('fs');
const path = require('path');
var profileController = require('../controllers/profile.controller')

// counter for picture storage file names
// appends a prefix of 00+counter+00+ to Date.now()_profile-picture for filenames.
var counter = 1;
// Creates directory for profile pictures
const profilePictureStorage = multer.diskStorage({
    destination : 'profile-picture-uploads/',

    filename: function (req: any, file: any, cb: any) {
      // Adding the a counter and current date to each filename so that each file is unique
      cb(null, '00' + counter + '00' + Date.now() + '_profile-picture' + path.extname(file.originalname));
    }
});
const uploadUser = multer({
    storage: profilePictureStorage,
    // Filters what the files that are uploaded
    fileFilter: ( req: any, file: any, callback: any ) => {
      console.log('This is the file');
      console.log(file);
  
      // captures to extension of the file e.i .png
      var ext = path.extname(file.originalname)
  
      // Makes sure that the image file is either a .jpg, .jpeg, or .png file.
      if( ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
         console.log('The file extention is correct. Good Job!')
      } else {
        return callback(new Error('Only jpg, jpeg, or png image files are allowed.'))
      }
    callback(null, true)
    },
  });


router.post('/register-profile', uploadUser.single('profile-picture'), profileController.registerProfile);
router.post('/send-register-code', profileController.sendRegisterCode);
router.post('/login-profile', profileController.loginProfile);

router.post('/get-user-profile', profileController.getUserProfile);

router.post('/get-favorite-programs', profileController.getFavoritePrograms);
router.post('/favorite-program', profileController.favoriteProgram);
router.post('/unfavorite-program', profileController.unfavoriteProgram);

router.post('/update-profile-picture', uploadUser.single('profile-picture'), profileController.updateProfilePicture);
router.post('/update-email', profileController.updateEmail);
router.post('/update-name', profileController.updateName);
router.post('/update-password', profileController.updatePassword);

router.post('/forgot-change-password', profileController.forgotChangePassword);
router.post('/forgot-email-validation', profileController.forgotEmailValidation);
export {};

module.exports = router;