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
            
            // This is correct - using fetch API to get data from your backend
            const response = await fetch(`/api/recipes/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const recipe = await response.json();
                
                // Check recipe record status
                await checkRecipeRecordStatus(id);
                
                displayRecipe(recipe);
                hideLoading();
                return;
            }
            
            // If API fetch fails, try to get from user recipes
            const userRecipesResponse = await fetch(`/api/users/${localStorage.getItem('userId')}/recipes/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (userRecipesResponse.ok) {
                const recipe = await userRecipesResponse.json();
                
                // Check recipe record status
                await checkRecipeRecordStatus(id);
                
                displayRecipe(recipe);
                hideLoading();
                return;
            }
            
            // If both fail, try the original method
            if (typeof getRecipeById === 'function') {
                const recipe = await getRecipeById(id);
                if (recipe) {
                    // Check recipe record status
                    await checkRecipeRecordStatus(id);
                    
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
     * Check recipe record status
     */
    async function checkRecipeRecordStatus(recipeId) {
        try {
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
                console.log('No user ID found, skipping recipe record check');
                return;
            }
            
            const response = await fetch(`/api/recipe-records/${recipeId}/user/${userId}/status`);
            
            if (response.ok) {
                const { rated, favorited, ratedCount } = await response.json();
                
                // Update star button
                updateStarButton(rated, ratedCount);
                
                // Update favorite button
                updateFavoriteButton(favorited);
            }
        } catch (error) {
            console.error('Error checking recipe record status:', error);
        }
    }

    /**
     * Update star button based on user's rating status
     */
    function updateStarButton(rated, ratedCount) {
        const starIcon = starBtn.querySelector('i');
        
        // Update star count
        starCount.textContent = ratedCount;
        
        // Update star icon and text
        if (rated) {
            starIcon.classList.remove('far');
            starIcon.classList.add('fas');
            starBtn.querySelector('span').textContent = 'Rated';
        } else {
            starIcon.classList.remove('fas');
            starIcon.classList.add('far');
            starBtn.querySelector('span').textContent = 'Rate Recipe';
        }
    }

    /**
     * Update favorite button based on user's favorite status
     */
    function updateFavoriteButton(favorited) {
        const heartIcon = favoriteBtn.querySelector('i');
        
        if (favorited) {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            favoriteBtn.querySelector('span').textContent = 'Remove from Favorites';
        } else {
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
            favoriteBtn.querySelector('span').textContent = 'Add to Favorites';
        }
    }

    /**
     * Set up event listeners for buttons
     */
    function setupEventListeners() {
        // Star button click handler
        starBtn.addEventListener('click', async function() {
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
                showToast('Please log in to rate recipes');
                return;
            }
            
            try {
                const response = await fetch(`/api/recipe-records/${recipeId}/rate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId })
                });
                
                if (response.ok) {
                    const { rated, ratedCount, message } = await response.json();
                    
                    // Update star button
                    updateStarButton(rated, ratedCount);
                    
                    // Show toast message
                    showToast(message);
                }
            } catch (error) {
                console.error('Error rating recipe:', error);
                showToast('Error rating recipe');
            }
        });
        
        // Favorite button click handler
        favoriteBtn.addEventListener('click', async function() {
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
                showToast('Please log in to favorite recipes');
                return;
            }
            
            try {
                const response = await fetch(`/api/recipe-records/${recipeId}/favorite`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId })
                });
                
                if (response.ok) {
                    const { favorited, message } = await response.json();
                    
                    // Update favorite button
                    updateFavoriteButton(favorited);
                    
                    // Show toast message
                    showToast(message);
                }
            } catch (error) {
                console.error('Error updating favorite status:', error);
                showToast('Error updating favorite status');
            }
        });
        
        // Print button click handler
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    /**
     * Display recipe data in the UI
     */
    function displayRecipe(recipe) {
        // Set basic recipe info
        recipeTitle.textContent = recipe.title;
        
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
    
    
    /**
     * Set up action buttons for user recipes
     */
    function setupActionButtons(recipe) {
        // Add event listener for favorite button
        favoriteBtn.addEventListener('click', async () => {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    showError('Please sign in to add favorites');
                    return;
                }
    
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        favorites: [recipe._id] // Send the recipe ID in an array
                    })
                });
    
                if (response.ok) {
                    const heartIcon = favoriteBtn.querySelector('i');
                    if (heartIcon.classList.contains('far')) {
                        heartIcon.classList.remove('far');
                        heartIcon.classList.add('fas');
                        favoriteBtn.querySelector('span').textContent = 'Remove from Favorites';
                        showToast('Added to favorites!');
                    } else {
                        heartIcon.classList.remove('fas');
                        heartIcon.classList.add('far');
                        favoriteBtn.querySelector('span').textContent = 'Add to Favorites';
                        showToast('Removed from favorites!');
                    }
                } else {
                    throw new Error('Failed to update favorites');
                }
            } catch (error) {
                console.error('Error updating favorites:', error);
                showError('Failed to update favorites');
            }
        });
    
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
               
        // Print button click handler
        printBtn.addEventListener('click', function() {
            window.print();
        });
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
        if (toastMessage) {
            toastMessage.textContent = message;
            toastMessage.classList.add('show');
            setTimeout(() => {
                toastMessage.classList.remove('show');
            }, 3000);
        }
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
                    //'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
        try {
            const userId = localStorage.getItem('userId');
            const authToken = localStorage.getItem('authToken');
            
            if (!userId || !authToken) {
                showError('Please sign in to add favorites');
                return;
            }
            
            const response = await fetch(`/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            const userData = await response.json();
            
            // Initialize profileData if it doesn't exist
            if (!userData.profileData) {
                userData.profileData = { favorites: [] };
            }
            
            // Initialize favorites array if it doesn't exist
            if (!userData.profileData.favorites) {
                userData.profileData.favorites = [];
            }
            
            const favorites = userData.profileData.favorites;
            const isFavorited = favorites.includes(recipeId);
            
            if (isFavorited) {
                // Remove from favorites
                userData.profileData.favorites = favorites.filter(id => id !== recipeId);
            } else {
                // Add to favorites
                userData.profileData.favorites.push(recipeId);
            }
            
            // Update user data
            const updateResponse = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    profileData: userData.profileData
                })
            });
            
            if (!updateResponse.ok) {
                throw new Error('Failed to update favorites');
            }
            
            // Update UI
            const heartIcon = favoriteBtn.querySelector('i');
            if (isFavorited) {
                heartIcon.classList.remove('fas');
                heartIcon.classList.add('far');
                favoriteBtn.querySelector('span').textContent = 'Add to Favorites';
                showToast('Removed from favorites');
            } else {
                heartIcon.classList.remove('far');
                heartIcon.classList.add('fas');
                favoriteBtn.querySelector('span').textContent = 'Remove from Favorites';
                showToast('Added to favorites');
            }
            
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showError('Failed to update favorites');
        }
    }
    
    async function saveRecipe(recipeId) {
        // Implement save functionality
        try {
            const response = await fetch(`/api/recipes/${recipeId}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    //'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
    
});