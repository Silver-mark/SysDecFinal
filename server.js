const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./db');
const User = require('./User');

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


// Simple root route
app.get('/', (req, res) => {
  res.redirect('/landing.html');
});

// User routes
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
                profileImage: user.profileData?.avatar || 'https://via.placeholder.com/150'
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
        
        console.log('Received update request for user:', userId);
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
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            bio: updatedUser.profileData?.bio || '',
            profileImage: updatedUser.profileData?.avatar || 'https://via.placeholder.com/150'
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
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            bio: updatedUser.profileData?.bio || '',
            profileImage: updatedUser.profileData?.avatar || 'https://via.placeholder.com/150'
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

// Use existing userController for register and login
const { registerUser, loginUser } = require('./userController');
app.post('/api/users/register', registerUser);
app.post('/api/users/login', loginUser);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});