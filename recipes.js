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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Recipe page loaded');
    
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    
    if (!userId || !authToken) {
        console.log('No user ID found, but continuing to allow recipe viewing');
    }

    // Get recipe ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    
    if (recipeId) {
        // Load specific recipe
        loadRecipe(recipeId);
    } else {
        // Show error message
        showError('No recipe ID provided');
    }
});

async function loadRecipe(recipeId) {
    try {
        showLoading('Loading recipe...');
        
        // First try to fetch from API
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const recipe = await response.json();
            displayRecipe(recipe);
            hideLoading();
            return;
        }
        
        // If API fetch fails, try to get from user recipes
        const userRecipesResponse = await fetch(`/api/users/${localStorage.getItem('userId')}/recipes/${recipeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (userRecipesResponse.ok) {
            const recipe = await userRecipesResponse.json();
            displayRecipe(recipe);
            hideLoading();
            return;
        }
        
        // If both fail, show error
        throw new Error('Failed to load recipe');
    } catch (error) {
        console.error('Error loading recipe:', error);
        showError('Failed to load recipe. Please try again later.');
        hideLoading();
    }
}

// Enhance displayRecipe function to handle user-created recipes
function displayRecipe(recipe) {
    // Set recipe title
    document.getElementById('recipe-title').textContent = recipe.title;
    
    // Set recipe meta information
    document.getElementById('recipe-time').textContent = `${recipe.cookingTime || '30'} mins`;
    document.getElementById('recipe-servings').textContent = `${recipe.servings || '4'} servings`;
    document.getElementById('recipe-difficulty').textContent = recipe.difficulty || 'Medium';
    
    // Set recipe author - check if it's a user recipe
    const authorElement = document.getElementById('recipe-author');
    if (recipe.userId && recipe.userId === localStorage.getItem('userId')) {
        authorElement.textContent = 'You';
    } else if (recipe.author) {
        authorElement.textContent = recipe.author;
    } else {
        authorElement.textContent = 'Unknown';
    }
    
    // Set recipe image
    const recipeImage = document.getElementById('recipe-image');
    if (recipe.image && recipe.image.trim() !== '') {
        recipeImage.src = recipe.image;
        recipeImage.alt = recipe.title;
    } else {
        recipeImage.src = 'https://via.placeholder.com/300x200?text=No+Image';
        recipeImage.alt = 'No image available';
    }
    
    // Set recipe description
    document.getElementById('recipe-description').textContent = recipe.description || 'No description available.';
    
    // Set ingredients list
    const ingredientsList = document.getElementById('ingredients-list');
    ingredientsList.innerHTML = '';
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            if (typeof ingredient === 'string') {
                li.textContent = ingredient;
            } else {
                // Handle structured ingredient object
                const amount = ingredient.amount || '';
                const unit = ingredient.unit || '';
                const name = ingredient.name || '';
                li.textContent = `${amount} ${unit} ${name}`.trim();
            }
            ingredientsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No ingredients listed.';
        ingredientsList.appendChild(li);
    }
    
    // Set instructions list
    const instructionsList = document.getElementById('instructions-list');
    instructionsList.innerHTML = '';
    
    if (recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach((instruction, index) => {
            const li = document.createElement('li');
            if (typeof instruction === 'string') {
                li.textContent = instruction;
            } else {
                // Handle structured instruction object
                li.textContent = instruction.text || '';
            }
            instructionsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No instructions provided.';
        instructionsList.appendChild(li);
    }
    
    // Setup action buttons for user recipes
    setupActionButtons(recipe);
}

function setupActionButtons(recipe) {
    const userId = localStorage.getItem('userId');
    
    // Star/Rate button
    const starBtn = document.getElementById('star-btn');
    if (starBtn) {
        starBtn.addEventListener('click', () => {
            if (!userId) {
                showError('Please sign in to rate recipes');
                return;
            }
            rateRecipe(recipe._id);
        });
    }
    
    // Favorite button
    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
            if (!userId) {
                showError('Please sign in to add favorites');
                return;
            }
            toggleFavorite(recipe._id);
        });
    }
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!userId) {
                showError('Please sign in to save recipes');
                return;
            }
            saveRecipe(recipe._id);
        });
    }
    
    // Print button
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
    
    // Copy button
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (!userId) {
                showError('Please sign in to copy recipes');
                return;
            }
            copyRecipe(recipe._id);
        });
    }
}

// Helper functions
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (errorContainer && errorMessage) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

function showLoading(message) {
    // Implement loading indicator if needed
    console.log(message);
}

function hideLoading() {
    // Hide loading indicator
}

// Recipe action functions
async function rateRecipe(recipeId) {
    // Implement rating functionality
    showError('Rating functionality coming soon!');
}

async function toggleFavorite(recipeId) {
    // Implement favorite functionality
    showError('Favorite functionality coming soon!');
}

async function saveRecipe(recipeId) {
    // Implement save functionality
    showError('Save functionality coming soon!');
}

async function copyRecipe(recipeId) {
    // Implement copy functionality
    showError('Copy functionality coming soon!');
}