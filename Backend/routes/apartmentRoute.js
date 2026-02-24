const express = require('express');
const router = express.Router();
const apartmentTypeController = require('../controllers/apartmentTypeController');
const auth = require('../middleware/auth');

router.get('/', auth, apartmentTypeController.getAllApartmentTypes);
router.get('/:id', auth, apartmentTypeController.getApartmentTypeById);
router.post('/', auth, apartmentTypeController.createApartmentType);
 

module.exports = router;
