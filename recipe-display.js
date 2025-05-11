// recipe-display.js - Handles the display and interaction with individual recipes

document.addEventListener('DOMContentLoaded', function() {
    // Get recipe ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    
    // Elements
    const recipeTitle = document.getElementById('recipe-title');
    const recipeTime = document.getElementById('recipe-time');
    const recipeServings = document.getElementById('recipe-servings');
    const recipeDifficulty = document.getElementById('recipe-difficulty');
    const recipeAuthor = document.getElementById('recipe-author');
    const recipeImage = document.getElementById('recipe-image');
    const recipeDescription = document.getElementById('recipe-description');
    const ingredientsList = document.getElementById('ingredients-list');
    const instructionsList = document.getElementById('instructions-list');
    const nutritionFacts = document.getElementById('nutrition-facts');
    const recipeNotes = document.getElementById('recipe-notes');
    const notesSection = document.getElementById('notes-section');
    const recipeTags = document.getElementById('recipe-tags');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const starBtn = document.getElementById('star-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');
    const copyBtn = document.getElementById('copy-btn');
    const starCount = document.getElementById('star-count');
    const toastMessage = document.getElementById('toast-message');
    
    // Check if we have a recipe ID
    if (!recipeId) {
        showError('No recipe selected. Please choose a recipe from the recipes page.');
        return;
    }
    
    // Fetch recipe data
    fetchRecipe(recipeId);
    
    // Set up event listeners for buttons
    setupEventListeners();
    
    // Additional code from recipes.js
    console.log('Recipe page loaded');
    
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    
    if (!userId || !authToken) {
        console.log('No user ID found, but continuing to allow recipe viewing');
    }
    
    /**
     * Fetch recipe data using the API
     */
    async function fetchRecipe(id) {
        try {
            showLoading('Loading recipe...');
            
            // First try to fetch from API
            const response = await fetch(`/api/recipes/${id}`, {
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
            const userRecipesResponse = await fetch(`/api/users/${localStorage.getItem('userId')}/recipes/${id}`, {
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
            
            // If both fail, try the original method
            if (typeof getRecipeById === 'function') {
                const recipe = await getRecipeById(id);
                if (recipe) {
                    displayRecipe(recipe);
                    hideLoading();
                    return;
                }
            }
            
            // If all methods fail, show error
            throw new Error('Failed to load recipe');
        } catch (error) {
            console.error('Error loading recipe:', error);
            showError('Error loading recipe: ' + error.message);
            hideLoading();
        }
    }
    
    /**
     * Display recipe data in the UI
     */
    function displayRecipe(recipe) {
        // Set basic recipe info
        recipeTitle.textContent = recipe.title;
        recipeTime.textContent = `${recipe.cookTime || recipe.cookingTime || '30'} mins`;
        recipeServings.textContent = `${recipe.servings || '4'} servings`;
        recipeDifficulty.textContent = capitalizeFirstLetter(recipe.difficulty || 'medium');
        
        // Set recipe image
        if (recipe.image && recipe.image.trim() !== '') {
            recipeImage.src = recipe.image;
            recipeImage.alt = recipe.title;
        } else {
            recipeImage.src = 'https://via.placeholder.com/800x400?text=No+Image+Available';
            recipeImage.alt = 'No image available';
        }
        
        // Set recipe description
        recipeDescription.innerHTML = recipe.description || 'No description available.';
        
        // Set author information
        if (recipe.userId && recipe.userId === localStorage.getItem('userId')) {
            recipeAuthor.textContent = 'You';
        } else if (recipe.author && recipe.author.name) {
            recipeAuthor.textContent = recipe.author.name;
        } else if (recipe.author) {
            recipeAuthor.textContent = recipe.author;
        } else {
            recipeAuthor.textContent = 'Unknown';
        }
        
        // Display ingredients
        displayIngredients(recipe.ingredients);
        
        // Display instructions
        displayInstructions(recipe.instructions);
        
        // Display categories if available
        recipeTags.innerHTML = '';
        if (recipe.categories && recipe.categories.length > 0) {
            recipe.categories.forEach(category => {
                const categoryTag = document.createElement('span');
                categoryTag.className = 'recipe-tag';
                categoryTag.textContent = category;
                recipeTags.appendChild(categoryTag);
            });
        }
        
        // Add difficulty tag
        const difficultyTag = document.createElement('span');
        difficultyTag.className = 'recipe-tag';
        difficultyTag.textContent = capitalizeFirstLetter(recipe.difficulty || 'medium');
        recipeTags.appendChild(difficultyTag);
        
        // Display mock nutrition facts
        displayMockNutritionFacts();
        
        // Setup action buttons
        setupActionButtons(recipe);
    }
    
    /**
     * Display ingredients list
     */
    function displayIngredients(ingredients) {
        ingredientsList.innerHTML = '';
        
        if (!ingredients || ingredients.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No ingredients listed';
            ingredientsList.appendChild(li);
            return;
        }
        
        ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            let text = '';
            
            if (typeof ingredient === 'string') {
                text = ingredient;
            } else if (ingredient.quantity) {
                text = `${ingredient.quantity} ${ingredient.name}`;
            } else if (ingredient.amount) {
                const amount = ingredient.amount || '';
                const unit = ingredient.unit || '';
                const name = ingredient.name || '';
                text = `${amount} ${unit} ${name}`.trim();
            } else {
                text = ingredient.name || '';
            }
            
            li.textContent = text;
            ingredientsList.appendChild(li);
        });
    }
    
    /**
     * Display instructions list
     */
    function displayInstructions(instructions) {
        instructionsList.innerHTML = '';
        
        if (!instructions || instructions.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No instructions provided';
            instructionsList.appendChild(li);
            return;
        }
        
        // Sort instructions by step number if available
        const sortedInstructions = [...instructions].sort((a, b) => {
            return (a.step || 0) - (b.step || 0);
        });
        
        sortedInstructions.forEach(instruction => {
            const li = document.createElement('li');
            if (typeof instruction === 'string') {
                li.textContent = instruction;
            } else {
                li.textContent = instruction.instruction || instruction.text || '';
            }
            instructionsList.appendChild(li);
        });
    }
    
    /**
     * Display mock nutrition facts
     */
    function displayMockNutritionFacts() {
        const nutritionItems = [
            { name: 'Calories', value: '350 kcal' },
            { name: 'Protein', value: '12g' },
            { name: 'Carbs', value: '45g' },
            { name: 'Fat', value: '14g' },
            { name: 'Fiber', value: '5g' },
            { name: 'Sugar', value: '8g' }
        ];
        
        nutritionFacts.innerHTML = '';
        
        nutritionItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'nutrition-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'nutrition-name';
            nameSpan.textContent = item.name;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'nutrition-value';
            valueSpan.textContent = item.value;
            
            div.appendChild(nameSpan);
            div.appendChild(valueSpan);
            nutritionFacts.appendChild(div);
        });
    }
    
    /**
     * Set up action buttons for user recipes
     */
    function setupActionButtons(recipe) {
        const userId = localStorage.getItem('userId');
        
        // Star/Rate button
        if (starBtn) {
            starBtn.onclick = function() {
                if (!userId) {
                    showError('Please sign in to rate recipes');
                    return;
                }
                const currentCount = parseInt(starCount.textContent);
                starCount.textContent = currentCount + 1;
                showToast('Thanks for rating this recipe!');
                
                // Toggle star icon
                const starIcon = starBtn.querySelector('i');
                starIcon.classList.remove('far');
                starIcon.classList.add('fas');
                
                rateRecipe(recipe._id);
            };
        }
        
        // Favorite button
        if (favoriteBtn) {
            favoriteBtn.onclick = function() {
                if (!userId) {
                    showError('Please sign in to add favorites');
                    return;
                }
                
                const heartIcon = favoriteBtn.querySelector('i');
                const isFavorite = heartIcon.classList.contains('fas');
                
                if (isFavorite) {
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                    favoriteBtn.querySelector('span').textContent = 'Add to Favorites';
                    showToast('Removed from favorites');
                } else {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                    favoriteBtn.querySelector('span').textContent = 'Remove from Favorites';
                    showToast('Added to favorites!');
                }
                
                toggleFavorite(recipe._id);
            };
        }
        
        // Save button
        if (saveBtn) {
            saveBtn.onclick = function() {
                if (!userId) {
                    showError('Please sign in to save recipes');
                    return;
                }
                
                const bookmarkIcon = saveBtn.querySelector('i');
                const isSaved = bookmarkIcon.classList.contains('fas');
                
                if (isSaved) {
                    bookmarkIcon.classList.remove('fas');
                    bookmarkIcon.classList.add('far');
                    showToast('Recipe removed from your collection');
                } else {
                    bookmarkIcon.classList.remove('far');
                    bookmarkIcon.classList.add('fas');
                    showToast('Recipe saved to your collection!');
                }
                
                saveRecipe(recipe._id);
            };
        }
        
        // Print button
        if (printBtn) {
            printBtn.onclick = function() {
                window.print();
            };
        }
        
        // Copy button
        if (copyBtn) {
            copyBtn.onclick = function() {
                if (!userId) {
                    showError('Please sign in to copy recipes');
                    return;
                }
                showToast('Recipe copied to your collection!');
                copyRecipe(recipe._id);
            };
        }
    }
    
    /**
     * Set up event listeners for interactive elements
     */
    function setupEventListeners() {
        // Event listeners will be set up in setupActionButtons
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
    
    /**
     * Show toast message
     */
    function showToast(message) {
        toastMessage.textContent = message;
        toastMessage.classList.add('show');
        
        setTimeout(function() {
            toastMessage.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Capitalize first letter of a string
     */
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Show loading indicator
     */
    function showLoading(message) {
        // Implement loading indicator if needed
        console.log(message);
    }
    
    /**
     * Hide loading indicator
     */
    function hideLoading() {
        // Hide loading indicator
    }
    
    /**
     * Recipe action functions
     */
    async function rateRecipe(recipeId) {
        // Implement rating functionality
        try {
            const response = await fetch(`/api/recipes/${recipeId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ rating: 5 }) // Default to 5 stars for now
            });
            
            if (!response.ok) {
                throw new Error('Failed to rate recipe');
            }
            
            showToast('Recipe rated successfully!');
        } catch (error) {
            console.error('Error rating recipe:', error);
            showError('Rating functionality coming soon!');
        }
    }
    
    async function toggleFavorite(recipeId) {
        // Implement favorite functionality
        try {
            const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to toggle favorite');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showError('Favorite functionality coming soon!');
        }
    }
    
    async function saveRecipe(recipeId) {
        // Implement save functionality
        try {
            const response = await fetch(`/api/recipes/${recipeId}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to save recipe');
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            showError('Save functionality coming soon!');
        }
    }
    
    async function copyRecipe(recipeId) {
        // Implement copy functionality
        try {
            const response = await fetch(`/api/recipes/${recipeId}/copy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to copy recipe');
            }
        } catch (error) {
            console.error('Error copying recipe:', error);
            showError('Copy functionality coming soon!');
        }
    }
});