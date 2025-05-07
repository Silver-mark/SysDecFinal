const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfileById, 
  updateUserProfile 
} = require('./userController');

// Import recipe controller functions
const {
  createRecipe,
  getUserRecipes,
  getPublicRecipes,
  updateRecipe,
  deleteRecipe,
  getRecipeById
} = require('./recipeController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Profile routes (simplified without auth middleware)
router.get('/profile/:id', getUserProfileById);
router.post('/profile', updateUserProfile);

// Recipe routes
router.post('/recipes', createRecipe);
router.get('/recipes/user/:userId', getUserRecipes);
router.get('/recipes/public', getPublicRecipes);
router.get('/recipes/:id', getRecipeById);
router.put('/recipes/:id', updateRecipe);
router.delete('/recipes/:id', deleteRecipe);

module.exports = router;
