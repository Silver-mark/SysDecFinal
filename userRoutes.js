const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  registerUser, 
  loginUser, 
  getUserProfileById, 
  updateUserProfile,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  googleAuth,
  googleSignup
} = require('./userController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
router.post('/google-auth', googleAuth);
router.post('/google-signup', googleSignup);

// Profile routes (simplified without auth middleware)
// Profile routes with file upload middleware
router.get('/profile/:id', getUserProfileById);
router.post('/profile', upload.single('avatar'), updateUserProfile);

// Recipe routes
router.post('/recipes', createRecipe);
router.get('/recipes/user/:userId', getUserRecipes);
router.get('/recipes/public', getPublicRecipes);
router.get('/recipes/:id', getRecipeById);
router.put('/recipes/:id', updateRecipe);
router.delete('/recipes/:id', deleteRecipe);

// Favorites routes
router.post('/favorites/add', addToFavorites);
router.post('/favorites/remove', removeFromFavorites);
router.get('/favorites/check/:userId/:recipeId', checkFavorite);

module.exports = router;