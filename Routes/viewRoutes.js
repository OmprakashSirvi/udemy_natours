const express = require('express');
const viewController = require('../controller/viewController');

const router = express.Router();

router.get('/', viewController.getOverview);

router.get('/tour', viewController.getTour);

router.get('/tour/:tourSlug', viewController.getTour);

module.exports = router;
