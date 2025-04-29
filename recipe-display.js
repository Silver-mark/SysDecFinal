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
    
    /**
     * Fetch recipe data using the MealDB API
     */
    async function fetchRecipe(id) {
        try {
            // Check if getRecipeById is available on the window object
            if (typeof getRecipeById !== 'function') {
                throw new Error('Recipe API not loaded properly');
            }
            
            const recipe = await getRecipeById(id);
            if (!recipe) {
                throw new Error('Recipe not found');
            }
            displayRecipe(recipe);
        } catch (error) {
            showError('Error loading recipe: ' + error.message);
        }
    }
    
    /**
     * Display recipe data in the UI
     */
    function displayRecipe(recipe) {
        // Set basic recipe info
        recipeTitle.textContent = recipe.title;
        recipeTime.textContent = `${recipe.cookTime} mins`;
        recipeServings.textContent = `${recipe.servings} servings`;
        recipeDifficulty.textContent = capitalizeFirstLetter(recipe.difficulty);
        
        // Set recipe image
        if (recipe.image && recipe.image.trim() !== '') {
            recipeImage.src = recipe.image;
            recipeImage.alt = recipe.title;
        } else {
            recipeImage.src = 'https://via.placeholder.com/800x400?text=No+Image+Available';
            recipeImage.alt = 'No image available';
        }
        
        // Set recipe description
        recipeDescription.innerHTML = recipe.description;
        
        // Set author information
        recipeAuthor.textContent = recipe.author ? recipe.author.name : 'Unknown';
        
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
        difficultyTag.textContent = capitalizeFirstLetter(recipe.difficulty);
        recipeTags.appendChild(difficultyTag);
        
        // Display mock nutrition facts
        displayMockNutritionFacts();
    }
    
    /**
     * No longer needed as author information is included in the recipe data
     */
    
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
            
            if (ingredient.quantity) {
                text = `${ingredient.quantity} ${ingredient.name}`;
            } else {
                text = ingredient.name;
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
            li.textContent = instruction.instruction || instruction.text;
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
     * Set up event listeners for interactive elements
     */
    function setupEventListeners() {
        // Star/rate button
        starBtn.addEventListener('click', function() {
            const currentCount = parseInt(starCount.textContent);
            starCount.textContent = currentCount + 1;
            showToast('Thanks for rating this recipe!');
            
            // Toggle star icon
            const starIcon = starBtn.querySelector('i');
            starIcon.classList.remove('far');
            starIcon.classList.add('fas');
        });
        
        // Favorite button
        favoriteBtn.addEventListener('click', function() {
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
        });
        
        // Save button
        saveBtn.addEventListener('click', function() {
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
        });
        
        // Print button
        printBtn.addEventListener('click', function() {
            window.print();
        });
        
        // Copy button
        copyBtn.addEventListener('click', function() {
            showToast('Recipe copied to your collection!');
        });
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'block';
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
});