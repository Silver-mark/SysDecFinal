const User = require('./User');
const { generateToken } = require('./auth');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(
  '444218256661-8skotkmfhlpt89057q0281eq0vu4qlku.apps.googleusercontent.com',
  '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'
);

// @desc    Register a new user - simplified version
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Simple check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with minimal validation and initialize arrays
    const user = await User.create({
      name,
      username,
      email,
      password,
      profileData: {
        bio: '',
        avatar: '',
        created: [],
        mealPlans: [],
        rated: [],
        favorites: [],
        preferences: {
          cuisines: [],
          diet: 'none',
          skillLevel: 'beginner',
          cookingTime: 'any'
        }
      }
    });

    // Return user data with token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      token: generateToken(user._id, user.isAdmin),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: 'Registration failed' });
  }
};

// @desc    Auth user & get token - simplified version
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Simplified login - accept either email or username
    const user = await User.findOne(
      email ? { email } : { username }
    );

    // Simple password check
    if (user && (await user.matchPassword(password))) {
      // Return user data with token
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        token: generateToken(user._id, user.isAdmin),
      });
    } else {
      res.status(401).json({ message: 'Invalid login details' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: 'Login failed' });
  }
};

const getUserProfileById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (user) {
      const profileData = user.profileData || {};
      
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
        created: profileData.created || [],
        mealPlans: profileData.mealPlans || [],
        rated: profileData.rated || [],
        favorites: profileData.favorites || [],
        preferences: profileData.preferences || {
          cuisines: [],
          diet: 'none',
          skillLevel: 'beginner',
          cookingTime: 'any'
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(400).json({ message: 'Could not retrieve profile' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId, name, bio, avatar, created, mealPlans, rated, favorites, preferences } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (name) user.name = name;
    
    user.profileData = {
      ...user.profileData,
      bio: bio || user.profileData?.bio || '',
      avatar: avatar || user.profileData?.avatar || '',
      created: created || user.profileData?.created || [],
      mealPlans: mealPlans || user.profileData?.mealPlans || [],
      rated: rated || user.profileData?.rated || [],
      favorites: favorites || user.profileData?.favorites || [],
      preferences: preferences || user.profileData?.preferences || {
        cuisines: [],
        diet: 'none',
        skillLevel: 'beginner',
        cookingTime: 'any'
      }
    };
    
    await user.save();
    
    res.json({
      _id: user._id,
      name: user.name,
      bio: user.profileData.bio,
      created: user.profileData.created,
      mealPlans: user.profileData.mealPlans,
      rated: user.profileData.rated,
      favorites: user.profileData.favorites,
      success: true
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ message: 'Could not update profile' });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '444218256661-8skotkmfhlpt89057q0281eq0vu4qlku.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    const user = await User.findOne({ email: payload.email });

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(404).json({ message: 'User not found. Please sign up first.' });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

const googleSignup = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '444218256661-8skotkmfhlpt89057q0281eq0vu4qlku.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    const existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name: payload.name,
      email: payload.email,
      profileData: {
        bio: '',
        avatar: '',
        created: [],
        mealPlans: [],
        rated: [],
        favorites: [],
        preferences: {
          cuisines: [],
          diet: 'none',
          skillLevel: 'beginner',
          cookingTime: 'any'
        }
      }
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Google signup error:', error);
    res.status(400).json({ message: 'Google signup failed' });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getUserProfileById, 
  updateUserProfile,
  googleAuth,
  googleSignup
};