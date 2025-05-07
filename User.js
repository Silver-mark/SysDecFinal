const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // Add profile data field to store extended profile information
    profileData: {
      type: {
        bio: String,
        avatar: String,
        created: [{ type: String }], // Array of recipe IDs
        mealPlans: [{ type: String }], // Array of meal plan IDs
        rated: [{ type: String }], // Array of rated recipe IDs
        favorites: [{ type: String }], // Array of favorite recipe IDs
        preferences: {
          cuisines: [{ type: String }],
          diet: { type: String, default: 'none' },
          skillLevel: { type: String, default: 'beginner' },
          cookingTime: { type: String, default: 'any' }
        }
      },
      default: {
        bio: '',
        avatar: '',
        created: ['53062'],
        mealPlans: ['53062'],
        rated: ['53062'],
        favorites: ['53062'],
        preferences: {
          cuisines: [],
          diet: 'none',
          skillLevel: 'beginner',
          cookingTime: 'any'
        }
      }
    }
  },
  {
    timestamps: true,
  }
);

// Simple password hashing before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }
  
  // Use a lower cost factor (8) for faster hashing since security isn't primary concern
  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check if entered password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);