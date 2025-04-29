// mealdb-api.js - Integration with TheMealDB API for Recspicy

// TheMealDB API base URL and key
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

/**
 * Fetch trending recipes (random selection from TheMealDB)
 * @returns {Promise<Array>} Array of recipe objects
 */
async function fetchTrendingRecipes() {
    try {
        // Using random selection endpoint for trending recipes
        const response = await fetch(`${API_BASE_URL}/random.php`);
        if (!response.ok) {
            throw new Error('Failed to fetch trending recipes');
        }
        const data = await response.json();
        
        // TheMealDB returns a single random meal, so we'll make multiple calls
        const recipes = [];
        if (data.meals && data.meals.length > 0) {
            recipes.push(formatMealDbRecipe(data.meals[0]));
            
            // Make additional calls to get more recipes
            for (let i = 0; i < 5; i++) {
                const additionalResponse = await fetch(`${API_BASE_URL}/random.php`);
                if (additionalResponse.ok) {
                    const additionalData = await additionalResponse.json();
                    if (additionalData.meals && additionalData.meals.length > 0) {
                        recipes.push(formatMealDbRecipe(additionalData.meals[0]));
                    }
                }
            }
        }
        
        return recipes;
    } catch (error) {
        console.error('Error fetching trending recipes:', error);
        return [];
    }
}

/**
 * Fetch featured recipes (meals from a specific category)
 * @returns {Promise<Array>} Array of recipe objects
 */
async function fetchFeaturedRecipes() {
    try {
        // Using category filter for featured recipes (e.g., Seafood)
        const response = await fetch(`${API_BASE_URL}/filter.php?c=Seafood`);
        if (!response.ok) {
            throw new Error('Failed to fetch featured recipes');
        }
        const data = await response.json();
        
        const recipes = [];
        if (data.meals && data.meals.length > 0) {
            // Get full details for each meal (the filter endpoint only returns basic info)
            for (let i = 0; i < Math.min(6, data.meals.length); i++) {
                const mealId = data.meals[i].idMeal;
                const detailResponse = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);
                if (detailResponse.ok) {
                    const detailData = await detailResponse.json();
                    if (detailData.meals && detailData.meals.length > 0) {
                        recipes.push(formatMealDbRecipe(detailData.meals[0]));
                    }
                }
            }
        }
        
        return recipes;
    } catch (error) {
        console.error('Error fetching featured recipes:', error);
        return [];
    }
}

/**
 * Fetch recommended recipes (meals from a different category)
 * @returns {Promise<Array>} Array of recipe objects
 */
async function fetchRecommendedRecipes() {
    try {
        // Using a different category for recommended recipes
        const response = await fetch(`${API_BASE_URL}/filter.php?c=Chicken`);
        if (!response.ok) {
            throw new Error('Failed to fetch recommended recipes');
        }
        const data = await response.json();
        
        const recipes = [];
        if (data.meals && data.meals.length > 0) {
            // Get full details for each meal
            for (let i = 0; i < Math.min(6, data.meals.length); i++) {
                const mealId = data.meals[i].idMeal;
                const detailResponse = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);
                if (detailResponse.ok) {
                    const detailData = await detailResponse.json();
                    if (detailData.meals && detailData.meals.length > 0) {
                        recipes.push(formatMealDbRecipe(detailData.meals[0]));
                    }
                }
            }
        }
        
        return recipes;
    } catch (error) {
        console.error('Error fetching recommended recipes:', error);
        return [];
    }
}

/**
 * Search for recipes by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of recipe objects
 */
async function searchRecipes(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Failed to search recipes');
        }
        const data = await response.json();
        
        const recipes = [];
        if (data.meals && data.meals.length > 0) {
            data.meals.forEach(meal => {
                recipes.push(formatMealDbRecipe(meal));
            });
        }
        
        return recipes;
    } catch (error) {
        console.error('Error searching recipes:', error);
        return [];
    }
}

/**
 * Get recipe details by ID
 * @param {string} id - Recipe ID
 * @returns {Promise<Object|null>} Recipe object or null if not found
 */
async function getRecipeById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch recipe details');
        }
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            return formatMealDbRecipe(data.meals[0]);
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        return null;
    }
}

/**
 * Get recipes by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of recipe objects
 */
async function getRecipesByCategory(category) {
    try {
        const response = await fetch(`${API_BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch recipes by category');
        }
        const data = await response.json();
        
        const recipes = [];
        if (data.meals && data.meals.length > 0) {
            // Get full details for each meal (limited to 10 for performance)
            for (let i = 0; i < Math.min(10, data.meals.length); i++) {
                const mealId = data.meals[i].idMeal;
                const detailResponse = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);
                if (detailResponse.ok) {
                    const detailData = await detailResponse.json();
                    if (detailData.meals && detailData.meals.length > 0) {
                        recipes.push(formatMealDbRecipe(detailData.meals[0]));
                    }
                }
            }
        }
        
        return recipes;
    } catch (error) {
        console.error('Error fetching recipes by category:', error);
        return [];
    }
}

/**
 * Get all available categories
 * @returns {Promise<Array>} Array of category objects
 */
async function getCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories.php`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        
        return data.categories || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Format a MealDB recipe to match the Recspicy app's data structure
 * @param {Object} meal - MealDB meal object
 * @returns {Object} Formatted recipe object
 */
function formatMealDbRecipe(meal) {
    // Extract ingredients and measures
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            ingredients.push({
                name: ingredient,
                quantity: measure || 'to taste'
            });
        }
    }
    
    // Extract instructions
    const instructions = meal.strInstructions
        .split('\r\n')
        .filter(step => step.trim() !== '')
        .map((step, index) => ({
            step: index + 1,
            instruction: step.trim()
        }));
    
    // Determine difficulty based on number of ingredients and steps
    let difficulty = 'Easy';
    if (ingredients.length > 10 || instructions.length > 7) {
        difficulty = 'Hard';
    } else if (ingredients.length > 5 || instructions.length > 4) {
        difficulty = 'Medium';
    }
    
    // Estimate cooking time based on complexity
    const cookTime = Math.max(15, ingredients.length * 5 + instructions.length * 3);
    
    // Extract categories
    const categories = [];
    if (meal.strCategory) categories.push(meal.strCategory);
    if (meal.strArea) categories.push(meal.strArea);
    if (meal.strTags) {
        meal.strTags.split(',').forEach(tag => {
            if (tag.trim() !== '') categories.push(tag.trim());
        });
    }
    
    // Determine if vegetarian based on ingredients
    const meatIngredients = ['chicken', 'beef', 'pork', 'lamb', 'meat', 'fish', 'seafood', 'shrimp', 'bacon'];
    const isVegetarian = !ingredients.some(ing => 
        meatIngredients.some(meat => ing.name.toLowerCase().includes(meat))
    );
    
    const dietaryCategories = [];
    if (isVegetarian) dietaryCategories.push('vegetarian');
    
    return {
        id: meal.idMeal,
        title: meal.strMeal,
        description: `A delicious ${meal.strCategory} recipe from ${meal.strArea} cuisine.`,
        image: meal.strMealThumb,
        cookTime: cookTime,
        servings: 4, // Default value as MealDB doesn't provide servings
        difficulty: difficulty,
        rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3-5
        categories: categories,
        dietaryCategories: dietaryCategories,
        ingredients: ingredients,
        instructions: instructions,
        author: {
            name: 'TheMealDB',
            id: 'mealdb'
        }
    };
}

// Export functions for use in other files
window.fetchTrendingRecipes = fetchTrendingRecipes;
window.fetchFeaturedRecipes = fetchFeaturedRecipes;
window.fetchRecommendedRecipes = fetchRecommendedRecipes;
window.searchRecipes = searchRecipes;
window.getRecipeById = getRecipeById;
window.getRecipesByCategory = getRecipesByCategory;
window.getCategories = getCategories;