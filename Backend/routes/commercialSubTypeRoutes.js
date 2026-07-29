const express = require('express');
const router = express.Router();
const commercialSubtypeController = require('../controllers/commercialSubtypeController');
const auth = require('../middleware/auth');

router.get('/', auth ,commercialSubtypeController.getAllCommercialSubtypes);
router.get('/:id' , auth , commercialSubtypeController.getCommercialSubtypeById);
router.post('/', auth, commercialSubtypeController.createCommercialSubtype);

module.exports = router;
