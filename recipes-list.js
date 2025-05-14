// recipes-list.js - Handles the display and interaction with the recipes listing page

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const recipesContainer = document.getElementById('recipes-container');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    // State
    let currentPage = 1;
    let currentFilter = 'all';
    let currentSearch = '';
    let allRecipes = [];
    let filteredRecipes = [];
    const recipesPerPage = 12;
    
    // Initialize
    fetchRecipes();
    setupEventListeners();
    
    /**
     * Fetch recipes from the server
     */
    async function fetchRecipes() {
        // Show loading state
        recipesContainer.innerHTML = '<div class="loading-spinner"></div>';
        
        try {
            let recipes = [];
            if (currentSearch) {
                // Case 3: Search by term
                recipes = await searchRecipes(currentSearch);
            } else if (currentFilter !== 'all') {
                // Case 2: Filter by category
                recipes = await getRecipesByCategory(currentFilter);
                allRecipes = recipes;
                filteredRecipes = recipes; // Add this line to ensure filtered recipes are set
                displayRecipes(); // Add this line to display the filtered recipes
                return; // Add this return to prevent duplicate display
            } else {
                // Case 1: No search or filter - fetch alphabetically
                const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
                for (const letter of letters) {
                    const letterRecipes = await fetchRecipesByLetter(letter);
                    recipes = [...recipes, ...letterRecipes];
                    
                    // Stop if we have enough recipes
                    if (recipes.length >= recipesPerPage * 2) {
                        break;
                    }
                }
            }
            
            allRecipes = recipes;
            applyFiltersAndSort();
        } catch (error) {
            showError('Error loading recipes: ' + error.message);
        }
    }
    
    /**
     * Apply filters and sorting to recipes
     */
    
    
    // Simplify the applyFiltersAndSort function by removing the sort logic:
    function applyFiltersAndSort() {
        // Filter recipes
        filteredRecipes = allRecipes.filter(recipe => {
            if (currentSearch && !recipe.title.toLowerCase().includes(currentSearch.toLowerCase())) {
                return false;
            }
            
            if (currentFilter === 'all') {
                return true;
            } else {
                return recipe.strCategory === currentFilter;
            }
        });
        
        // Reset pagination
        currentPage = 1;
        
        // Display recipes
        displayRecipes();
    }
    
    /**
     * Display recipes in the container
     */
    function displayRecipes() {
        // Clear container
        recipesContainer.innerHTML = '';
        
        // Get recipes for current page
        const startIndex = (currentPage - 1) * recipesPerPage;
        const endIndex = startIndex + recipesPerPage;
        const recipesToShow = filteredRecipes.slice(startIndex, endIndex);
        
        // Create and append recipe cards
        recipesToShow.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            
            // Set default image if none provided
            const imageUrl = recipe.strMealThumb || recipe.image || 
                            'https://via.placeholder.com/300x200?text=No+Image';
            
            // Get the category from the API response
            const category = recipe.strCategory || '';
            
            card.innerHTML = `
                <div class="recipe-card-image">
                    <img src="${imageUrl}" alt="${recipe.strMeal || recipe.title}" class="recipe-image">
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.strMeal || recipe.title}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-category">${category}</span>
                    </div>
                </div>
            `;
            
            // Add click handler
            card.addEventListener('click', () => {
                window.location.href = `recipes.html?id=${recipe.idMeal || recipe.id}`;
            });
            
            recipesContainer.appendChild(card);
        });
        
        // Update load more button visibility
        loadMoreBtn.style.display = endIndex >= filteredRecipes.length ? 'none' : 'block';
    }
    
    /**
     * Create a recipe card element
     */
    function createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        // Format date
        const date = new Date(recipe.createdAt);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        
        // Set default image if none provided
        const imageUrl = recipe.image && recipe.image.trim() !== '' 
            ? recipe.image 
            : 'https://via.placeholder.com/300x200?text=No+Image';
        
        card.innerHTML = `
            <div class="recipe-card-image">
                <img src="${imageUrl}" alt="${recipe.title}">
                <div class="recipe-card-difficulty ${recipe.difficulty}">${capitalizeFirstLetter(recipe.difficulty)}</div>
            </div>
            <div class="recipe-card-content">
                <h3 class="recipe-card-title">${recipe.title}</h3>
                <div class="recipe-card-meta">
                    <span><i class="fas fa-clock"></i> ${recipe.cookingTime} mins</span>
                    <span><i class="fas fa-utensils"></i> ${recipe.servings} servings</span>
                </div>
                <p class="recipe-card-description">${truncateText(recipe.description, 100)}</p>
                <div class="recipe-card-footer">
                    <span class="recipe-card-date">${formattedDate}</span>
                    <a href="recipes.html?id=${recipe._id}" class="recipe-card-link">View Recipe</a>
                </div>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Search input with debounce
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = this.value.trim();
                fetchRecipes();
            }, 500);
        });
        
        // Filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', async function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update filter (don't reset to 'all')
                currentFilter = this.dataset.filter;
                currentSearch = ''; // Clear search term
                
                // Clear the search input
                searchInput.value = '';
                
                // Fetch recipes with the new filter
                fetchRecipes();
            });
        });
        
        // Remove sort select event listener as it's not needed
        
        // Load more button
        loadMoreBtn.addEventListener('click', function() {
            currentPage++;
            displayRecipes();
        });
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'block';
        recipesContainer.innerHTML = '';
    }
    
    /**
     * Helper function to truncate text
     */
    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
    
    /**
     * Capitalize first letter of a string
     */
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});