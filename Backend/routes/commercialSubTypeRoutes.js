const express = require('express');
const router = express.Router();
const commercialSubtypeController = require('../controllers/commercialSubtypeController');

router.get('/', commercialSubtypeController.getAllCommercialSubtypes);
router.get('/:id', commercialSubtypeController.getCommercialSubtypeById);
router.post('/', commercialSubtypeController.createCommercialSubtype);

module.exports = router;
