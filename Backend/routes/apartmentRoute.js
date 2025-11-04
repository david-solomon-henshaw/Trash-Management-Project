const express = require('express');
const router = express.Router();
const apartmentTypeController = require('../controllers/apartmentTypeController');

router.get('/', apartmentTypeController.getAllApartmentTypes);
router.get('/:id', apartmentTypeController.getApartmentTypeById);
router.post('/', apartmentTypeController.createApartmentType);
 

module.exports = router;
