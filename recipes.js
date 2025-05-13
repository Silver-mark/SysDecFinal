const mongoose = require('mongoose');

const recipeSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    ingredients: [{
      name: String,
      amount: String,
      unit: String
    }],
    instructions: [{
      step: Number,
      text: String
    }],
    cookingTime: {
      type: Number,
      required: true
    },
    servings: {
      type: Number,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    cuisine: {
      type: String,
      default: 'other'
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    image: {
      type: String,
      default: ''
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = mongoose.model('Recipe', recipeSchema);