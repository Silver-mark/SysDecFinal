const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    days: {
        monday: {
            meal: String,
            ingredients: [String],
            instructions: String
        },
        tuesday: {
            meal: String,
            ingredients: [String],
            instructions: String
        },
        wednesday: {
            meal: String,
            ingredients: [String],
            instructions: String
        },
        thursday: {
            meal: String,
            ingredients: [String],
            instructions: String
        },
        friday: {
            meal: String,
            ingredients: [String],
            instructions: String
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = MealPlan;