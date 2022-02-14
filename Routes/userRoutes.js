const express = require('express');
const userController = require('../controller/userController'); // Imported all the controllers
const authController = require('../controller/authenticationController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all route after this middleware
router.use(authController.protect);
// becasue we need 'authController.protect' in every single route from here on

router.post('/updatePassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// Now from here on all of this actions is meant for the administrator..
router.use(authController.restrictTo('admin'));
// So we use the same technique

router.route('/').get(userController.getAllUsers).post(userController.addUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.delUser);

module.exports = router;
