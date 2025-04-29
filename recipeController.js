const Recipe = require('./recipes');

// Create a new recipe
const createRecipe = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookingTime, 
      servings, 
      difficulty, 
      cuisine, 
      isPublic, 
      image, 
      userId 
    } = req.body;

    // Simple validation
    if (!title || !description || !userId) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Create recipe
    const recipe = await Recipe.create({
      title,
      description,
      ingredients: ingredients || [],
      instructions: instructions || [],
      cookingTime: cookingTime || 30,
      servings: servings || 4,
      difficulty: difficulty || 'medium',
      cuisine: cuisine || 'other',
      isPublic: isPublic !== undefined ? isPublic : true,
      image: image || '',
      userId
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error('Recipe creation error:', error);
    res.status(400).json({ message: 'Could not create recipe' });
  }
};

// Get all recipes for a specific user
const getUserRecipes = async (req, res) => {
  try {
    const { userId } = req.params;
    const recipes = await Recipe.find({ userId }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    console.error('Get user recipes error:', error);
    res.status(400).json({ message: 'Could not retrieve recipes' });
  }
};

// Get all public recipes
const getPublicRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ isPublic: true }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    console.error('Get public recipes error:', error);
    res.status(400).json({ message: 'Could not retrieve public recipes' });
  }
};

// Get a specific recipe by ID
const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(400).json({ message: 'Could not retrieve recipe' });
  }
};

// Update a recipe
const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookingTime, 
      servings, 
      difficulty, 
      cuisine, 
      isPublic, 
      image 
    } = req.body;

    const recipe = await Recipe.findById(id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Update fields
    if (title) recipe.title = title;
    if (description) recipe.description = description;
    if (ingredients) recipe.ingredients = ingredients;
    if (instructions) recipe.instructions = instructions;
    if (cookingTime) recipe.cookingTime = cookingTime;
    if (servings) recipe.servings = servings;
    if (difficulty) recipe.difficulty = difficulty;
    if (cuisine) recipe.cuisine = cuisine;
    if (isPublic !== undefined) recipe.isPublic = isPublic;
    if (image) recipe.image = image;
    
    recipe.updatedAt = Date.now();
    
    await recipe.save();
    res.json(recipe);
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(400).json({ message: 'Could not update recipe' });
  }
};

// Delete a recipe
const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    await Recipe.deleteOne({ _id: id });
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(400).json({ message: 'Could not delete recipe' });
  }
};

module.exports = {
  createRecipe,
  getUserRecipes,
  getPublicRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe
};