const MealPlan = require('./MealPlan');

// Create a new meal plan
exports.createMealPlan = async (req, res) => {
    try {
        const { planName, description, days } = req.body;
        
        // Get user ID from request or token
        const userId = req.body.userId || req.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User authentication required' });
        }
        
        const mealPlan = new MealPlan({
            userId,
            planName,
            description,
            days
        });
        
        const savedMealPlan = await mealPlan.save();
        
        res.status(201).json({
            success: true,
            mealPlan: savedMealPlan
        });
    } catch (error) {
        console.error('Error creating meal plan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating meal plan' 
        });
    }
};

// Get all meal plans for a user
exports.getUserMealPlans = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const mealPlans = await MealPlan.find({ userId })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            mealPlans
        });
    } catch (error) {
        console.error('Error fetching meal plans:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching meal plans' 
        });
    }
};

// Get a specific meal plan by ID
exports.getMealPlanById = async (req, res) => {
    try {
        const mealPlanId = req.params.id;
        
        const mealPlan = await MealPlan.findById(mealPlanId);
        
        if (!mealPlan) {
            return res.status(404).json({ 
                success: false,
                message: 'Meal plan not found' 
            });
        }
        
        res.json({
            success: true,
            mealPlan
        });
    } catch (error) {
        console.error('Error fetching meal plan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching meal plan' 
        });
    }
};

// Update a meal plan
exports.updateMealPlan = async (req, res) => {
    try {
        const mealPlanId = req.params.id;
        const updates = req.body;
        
        const mealPlan = await MealPlan.findById(mealPlanId);
        
        if (!mealPlan) {
            return res.status(404).json({ 
                success: false,
                message: 'Meal plan not found' 
            });
        }
        
        // Check if the user owns this meal plan
        if (mealPlan.userId.toString() !== req.body.userId) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to update this meal plan' 
            });
        }
        
        const updatedMealPlan = await MealPlan.findByIdAndUpdate(
            mealPlanId,
            updates,
            { new: true }
        );
        
        res.json({
            success: true,
            mealPlan: updatedMealPlan
        });
    } catch (error) {
        console.error('Error updating meal plan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating meal plan' 
        });
    }
};

// Delete a meal plan
exports.deleteMealPlan = async (req, res) => {
    try {
        const mealPlanId = req.params.id;
        
        const mealPlan = await MealPlan.findById(mealPlanId);
        
        if (!mealPlan) {
            return res.status(404).json({ 
                success: false,
                message: 'Meal plan not found' 
            });
        }
        
        // Check if the user owns this meal plan
        if (mealPlan.userId.toString() !== req.body.userId) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to delete this meal plan' 
            });
        }
        
        await MealPlan.findByIdAndDelete(mealPlanId);
        
        res.json({
            success: true,
            message: 'Meal plan deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting meal plan:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting meal plan' 
        });
    }
};