const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
const connectDB = require('./db');
const User = require('./User');
const multer = require('multer');
const RecipeRecord = require('./recipeRecord');

// Configure multer for memory storage (for binary data)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  
});


// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Import routes
const userRoutes = require('./userRoutes');

// Mount routes
app.use('/api', userRoutes);

// Simple root route
app.get('/', (req, res) => {
  res.redirect('/landing.html');
});

// User routes
// Get total user count - MUST come before the :userId route
app.get('/api/users/count/total', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error counting users:', error);
        res.status(500).json({ message: 'Error counting users' });
    }
});

// Add this new endpoint for recipe count
app.get('/api/recipes/count/total', async (req, res) => {
    try {
        const Recipe = require('./recipes');
        const count = await Recipe.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error counting recipes:', error);
        res.status(500).json({ message: 'Error counting recipes' });
    }
});

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.profileData?.bio || '',
                profileImage: user.profileData?.avatar,
                favorites: user.profileData?.favorites // Add favorites array
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Update user profile - PUT endpoint
app.put('/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userData = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile data
        user.profileData = {
            ...user.profileData,
            bio: userData.bio || user.profileData?.bio,
            avatar: userData.profileImage || user.profileData?.avatar,
            favorites: userData.favorites || user.profileData?.favorites // Missing this line
        };

        // Update basic user info if provided
        if (userData.name) user.name = userData.name;
        if (userData.email) user.email = userData.email;
        
        const updatedUser = await user.save();
        
        console.log('Updated user:', updatedUser);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.profileData?.bio || '',
            profileImage: user.profileData?.avatar,
            favorites: user.profileData?.favorites // Add favorites array
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user profile' });
    }
});

// Update the user profile endpoint to handle avatar uploads
app.put('/api/users/:userId', upload.single('avatar'), async (req, res) => {
    try {
      const userId = req.params.userId;
      const userData = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update avatar if a new file was uploaded
      let avatar = user.profileData?.avatar;
      if (req.file) {
        avatar = {
          data: req.file.buffer,
          contentType: req.file.mimetype
        };
      }
  
      // Update profile data
      user.profileData = {
        ...user.profileData,
        bio: userData.bio || user.profileData?.bio,
        avatar: avatar,
        favorites: userData.favorites || user.profileData?.favorites
      };
  
      // Update basic user info if provided
      if (userData.name) user.name = userData.name;
      if (userData.email) user.email = userData.email;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.profileData?.bio || '',
        hasAvatar: !!user.profileData?.avatar?.data,
        favorites: user.profileData?.favorites
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user profile' });
    }
  });

// Alternative update endpoint - POST endpoint
app.post('/api/users/update', async (req, res) => {
    try {
        const { userId, ...userData } = req.body;
        
        console.log('Received alternative update request for user:', userId);
        console.log('Update data:', userData);
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile data
        user.profileData = {
            ...user.profileData,
            bio: userData.bio || user.profileData?.bio,
            avatar: userData.profileImage || user.profileData?.avatar
        };

        // Update basic user info if provided
        if (userData.name) user.name = userData.name;
        if (userData.email) user.email = userData.email;
        
        const updatedUser = await user.save();
        
        console.log('Updated user:', updatedUser);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.profileData?.bio || '',
            profileImage: user.profileData?.avatar,
            favorites: user.profileData?.favorites // Add favorites array
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user profile' });
    }
});

// Recipe routes
const { createRecipe, getUserRecipes, getPublicRecipes, getRecipeById, updateRecipe, deleteRecipe } = require('./recipeController');

// Recipe endpoints
app.post('/api/recipes', createRecipe);
app.get('/api/recipes/user/:userId', getUserRecipes);
app.get('/api/recipes/public', getPublicRecipes);
app.get('/api/recipes/:id', getRecipeById);
app.put('/api/recipes/:id', updateRecipe);
app.delete('/api/recipes/:id', deleteRecipe);

// Add meal plan routes
const mealPlanController = require('./mealPlanController');

// Create a new meal plan
app.post('/api/meal-plans', mealPlanController.createMealPlan);

// Get all meal plans for a user
app.get('/api/meal-plans/user/:userId', mealPlanController.getUserMealPlans);

// Get a specific meal plan
app.get('/api/meal-plans/:id', mealPlanController.getMealPlanById);

// Update a meal plan
app.put('/api/meal-plans/:id', mealPlanController.updateMealPlan);

// Delete a meal plan
app.delete('/api/meal-plans/:id', mealPlanController.deleteMealPlan);

// Add these new endpoints for admin dashboard
const Recipe = require('./recipes');

// Get dashboard stats
app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    // Calculate some basic stats
    const userCount = await User.countDocuments();
    const recipeCount = await Recipe.countDocuments();
    const publicRecipes = await Recipe.countDocuments({ isPublic: true });
    const privateRecipes = await Recipe.countDocuments({ isPublic: false });
    
    res.json({
      userCount,
      recipeCount,
      publicRecipes,
      privateRecipes,
      newUsersThisWeek: Math.floor(userCount * 0.15), // Simulated data
      newRecipesThisWeek: Math.floor(recipeCount * 0.2), // Simulated data
      activeUsers: Math.floor(userCount * 0.6) // Simulated data
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

app.get('/api/users/:userId/meal-plans', async (req, res) => {
    try {
        const MealPlan = require('./MealPlan');
        const mealPlans = await MealPlan.find({ userId: req.params.userId });
        res.json(mealPlans);
    } catch (error) {
        console.error('Error fetching meal plans:', error);
        res.status(500).json({ message: 'Error fetching meal plans' });
    }
});

// Get top performing recipes
app.get('/api/admin/recipes/top', async (req, res) => {
  try {
    // Get 5 random recipes for demonstration
    const recipes = await Recipe.find().limit(5);
    
    // Add some simulated metrics
    const topRecipes = recipes.map(recipe => ({
      _id: recipe._id,
      title: recipe.title,
      views: Math.floor(Math.random() * 1000),
      favorites: Math.floor(Math.random() * 100),
      rating: (3 + Math.random() * 2).toFixed(1),
      createdAt: recipe.createdAt
    }));
    
    res.json(topRecipes);
  } catch (error) {
    console.error('Error fetching top recipes:', error);
    res.status(500).json({ message: 'Error fetching top recipes' });
  }
});

// Use existing userController for register and login
const { registerUser, loginUser } = require('./userController');
app.post('/api/users/register', registerUser);
app.post('/api/users/login', loginUser);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Add a new endpoint for avatar uploads
app.post('/api/users/:userId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's avatar with binary data
    user.profileData = {
      ...user.profileData,
      avatar: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    };

    await user.save();
    
    res.json({
      success: true,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
});

// Add an endpoint to retrieve the avatar
app.get('/api/users/:userId/avatar', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user || !user.profileData?.avatar?.data) {
      return res.status(404).sendFile(path.join(__dirname, 'default-avatar.png'));
    }
    
    res.set('Content-Type', user.profileData.avatar.contentType);
    res.send(user.profileData.avatar.data);
  } catch (error) {
    console.error('Error retrieving avatar:', error);
    res.status(500).json({ message: 'Error retrieving avatar' });
  }
});



// Alternative update endpoint - POST endpoint
app.post('/api/users/update', async (req, res) => {
    try {
        const { userId, name, bio, avatar } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Process avatar if provided as base64
        if (avatar && avatar.startsWith('data:')) {
            const matches = avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            
            if (matches && matches.length === 3) {
                user.profileData.avatar = {
                    data: Buffer.from(matches[2], 'base64'),
                    contentType: matches[1]
                };
            }
        }

        // Update other fields
        if (name) user.name = name;
        if (bio) user.profileData.bio = bio;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.profileData.bio,
            hasAvatar: !!user.profileData.avatar?.data,
            profileImage: user.profileData.avatar?.data ? 
                `/api/users/${userId}/avatar` : null
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user profile' });
    }
});

// Add an endpoint to retrieve the avatar
app.get('/api/users/:userId/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user?.profileData?.avatar?.data) {
            return res.status(404).json({ message: 'Avatar not found' });
        }
        
        res.set('Content-Type', user.profileData.avatar.contentType);
        res.send(user.profileData.avatar.data);
    } catch (error) {
        console.error('Error fetching avatar:', error);
        res.status(500).json({ message: 'Error fetching avatar' });
    }
});
// Update the user profile endpoint to handle avatar uploads
app.get('/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.profileData?.bio || '',
                hasAvatar: !!user.profileData?.avatar?.data,
                favorites: user.profileData?.favorites
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Alternative update endpoint - POST endpoint
app.post('/api/users/update', async (req, res) => {
    try {
        const { userId, ...userData } = req.body;
        
        console.log('Received alternative update request for user:', userId);
        console.log('Update data:', userData);
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile data
        user.profileData = {
            ...user.profileData,
            bio: userData.bio || user.profileData?.bio,
            avatar: userData.profileImage || user.profileData?.avatar
        };

        // Update basic user info if provided
        if (userData.name) user.name = userData.name;
        if (userData.email) user.email = userData.email;
        
        const updatedUser = await user.save();
        
        console.log('Updated user:', updatedUser);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.profileData?.bio || '',
            profileImage: user.profileData?.avatar,
            favorites: user.profileData?.favorites // Add favorites array
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user profile' });
    }
});
// Add this route for avatar uploads
app.post('/api/users/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.profileData.avatar = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };
    
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: 'Error uploading avatar' });
  }
});


// Get recipe record or create if it doesn't exist
app.get('/api/recipe-records/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    // Find or create recipe record
    let recipeRecord = await RecipeRecord.findOne({ recipeId });
    
    if (!recipeRecord) {
      recipeRecord = await RecipeRecord.create({
        recipeId,
        ratedBy: [],
        favoritedBy: []
      });
    }
    
    res.json(recipeRecord);
  } catch (error) {
    console.error('Error fetching recipe record:', error);
    res.status(500).json({ message: 'Error fetching recipe record' });
  }
});

// Toggle user rating for a recipe
app.post('/api/recipe-records/:recipeId/rate', async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Find or create recipe record
    let recipeRecord = await RecipeRecord.findOne({ recipeId });
    
    if (!recipeRecord) {
      recipeRecord = await RecipeRecord.create({
        recipeId,
        ratedBy: [userId],
        favoritedBy: []
      });
      
      return res.json({ 
        rated: true, 
        ratedCount: 1,
        message: 'Recipe rated successfully' 
      });
    }
    
    // Check if user has already rated
    const userIndex = recipeRecord.ratedBy.indexOf(userId);
    
    if (userIndex === -1) {
      // Add user to ratedBy array
      recipeRecord.ratedBy.push(userId);
      await recipeRecord.save();
      
      return res.json({ 
        rated: true, 
        ratedCount: recipeRecord.ratedBy.length,
        message: 'Recipe rated successfully' 
      });
    } else {
      // Remove user from ratedBy array
      recipeRecord.ratedBy.splice(userIndex, 1);
      await recipeRecord.save();
      
      return res.json({ 
        rated: false, 
        ratedCount: recipeRecord.ratedBy.length,
        message: 'Rating removed successfully' 
      });
    }
  } catch (error) {
    console.error('Error rating recipe:', error);
    res.status(500).json({ message: 'Error rating recipe' });
  }
});

// Toggle user favorite for a recipe
app.post('/api/recipe-records/:recipeId/favorite', async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Find or create recipe record
    let recipeRecord = await RecipeRecord.findOne({ recipeId });
    
    if (!recipeRecord) {
      recipeRecord = await RecipeRecord.create({
        recipeId,
        ratedBy: [],
        favoritedBy: [userId]
      });
      
      return res.json({ 
        favorited: true,
        message: 'Recipe added to favorites' 
      });
    }
    
    // Check if user has already favorited
    const userIndex = recipeRecord.favoritedBy.indexOf(userId);
    
    if (userIndex === -1) {
      // Add user to favoritedBy array
      recipeRecord.favoritedBy.push(userId);
      await recipeRecord.save();
      
      return res.json({ 
        favorited: true,
        message: 'Recipe added to favorites' 
      });
    } else {
      // Remove user from favoritedBy array
      recipeRecord.favoritedBy.splice(userIndex, 1);
      await recipeRecord.save();
      
      return res.json({ 
        favorited: false,
        message: 'Recipe removed from favorites' 
      });
    }
  } catch (error) {
    console.error('Error updating favorite status:', error);
    res.status(500).json({ message: 'Error updating favorite status' });
  }
});

// Check if user has rated or favorited a recipe
app.get('/api/recipe-records/:recipeId/user/:userId/status', async (req, res) => {
  try {
    const { recipeId, userId } = req.params;
    
    // Find recipe record
    const recipeRecord = await RecipeRecord.findOne({ recipeId });
    
    if (!recipeRecord) {
      return res.json({ 
        rated: false, 
        favorited: false,
        ratedCount: 0
      });
    }
    
    // Check if user has rated or favorited
    const rated = recipeRecord.ratedBy.includes(userId);
    const favorited = recipeRecord.favoritedBy.includes(userId);
    
    res.json({ 
      rated, 
      favorited,
      ratedCount: recipeRecord.ratedBy.length
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ message: 'Error checking user status' });
  }
});
