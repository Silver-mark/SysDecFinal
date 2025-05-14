const mongoose = require('mongoose');

const recipeRecordSchema = new mongoose.Schema({
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  ratedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Create a compound index to ensure uniqueness
recipeRecordSchema.index({ recipeId: 1 }, { unique: true });

module.exports = mongoose.model('RecipeRecord', recipeRecordSchema);