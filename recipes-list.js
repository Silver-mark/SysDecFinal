// recipes-list.js - Handles the display and interaction with the recipes listing page

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const recipesContainer = document.getElementById('recipes-container');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-select');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    // State
    let currentPage = 1;
    let currentFilter = 'all';
    let currentSort = 'newest';
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
                // Use search endpoint if there's a search query
                recipes = await searchRecipes(currentSearch);
            } else if (currentFilter === 'all') {
                // Get a mix of recipes for "all" filter
                const trending = await fetchTrendingRecipes();
                const featured = await fetchFeaturedRecipes();
                const recommended = await fetchRecommendedRecipes();
                recipes = [...trending, ...featured, ...recommended];
            } else {
                // Get recipes by category for other filters
                recipes = await getRecipesByCategory(currentFilter);
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
    function applyFiltersAndSort() {
        // Filter recipes
        filteredRecipes = allRecipes.filter(recipe => {
            // Apply search filter
            if (currentSearch && !recipe.title.toLowerCase().includes(currentSearch.toLowerCase())) {
                return false;
            }
            
            // Apply category filter
            if (currentFilter === 'all') {
                return true;
            } else {
                return recipe.strCategory === currentFilter;
            }
            
            return true;
        });
        
        // Sort recipes
        filteredRecipes.sort((a, b) => {
            if (currentSort === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (currentSort === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            } else if (currentSort === 'az') {
                return a.title.localeCompare(b.title);
            } else if (currentSort === 'za') {
                return b.title.localeCompare(a.title);
            } else if (currentSort === 'quickest') {
                return a.cookingTime - b.cookingTime;
            }
            
            return 0;
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
            card.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <div class="recipe-stats">
                            <span class="stat-item">
                                <i class="stat-icon">⏱️</i>
                                ${recipe.cookTime || '30'} mins
                            </span>
                            <span class="stat-item">
                                <i class="stat-icon">👨‍🍳</i>
                                ${recipe.difficulty || 'Easy'}
                            </span>
                            <span class="stat-item">
                                <i class="stat-icon">⭐</i>
                                ${recipe.rating || '4.5'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            
            // Add click handler
            card.addEventListener('click', () => {
                window.location.href = `recipes.html?id=${recipe.id}`; // Changed from recipe.html to recipes.html
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
                
                // Update filter and search with the filter text
                currentFilter = 'all'; // Reset the filter since we're using search
                currentSearch = this.dataset.filter; // Use the filter value as search term
                
                // Don't search if it's the "all" button
                if (currentSearch === 'all') {
                    currentSearch = '';
                }
                
                // Clear the search input
                searchInput.value = '';
                
                // Fetch recipes with the new search term
                fetchRecipes();
            });
        });
        
        // Sort select
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            applyFiltersAndSort();
        });
        
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