const express  = require("express");
const router  = express.Router();
var programsController = require('../controllers/programs.controller')

router.get('/get-all-programs', programsController.getAllPrograms);
router.post('/get-program-info', programsController.getProgramInfo);
router.post('/add-program', programsController.addProgram);
router.post('/edit-program', programsController.editProgram);
router.post('/delete-program', programsController.deleteProgram);
export {};

module.exports = router;