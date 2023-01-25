const express  = require("express");
const router  = express.Router();
var profileController = require('../controllers/profile.controller')

router.post('/register-profile', profileController.registerProfile);
router.post('/send-register-code', profileController.sendRegisterCode);
router.post('/login-profile', profileController.loginProfile);

router.post('/get-user-profile', profileController.getUserProfile);

router.post('/get-favorite-programs', profileController.getFavoritePrograms);
router.post('/favorite-program', profileController.favoriteProgram);
router.post('/unfavorite-program', profileController.unfavoriteProgram);


router.post('/update-profile-picture', profileController.updateProfilePicture);
router.post('/update-email', profileController.updateEmail);
router.post('/update-name', profileController.updateName);
router.post('/update-password', profileController.updatePassword);

router.post('/forgot-change-password', profileController.forgotChangePassword);
router.post('/forgot-email-validation', profileController.forgotEmailValidation);
export {};

module.exports = router;