let currentResults = [];
let currentSort = 'relevance';

// Initialize search functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeSearchComponents();
    setupEventListeners();
    handleInitialSearch();
});

function initializeSearchComponents() {
    window.searchComponents = {
        form: document.getElementById('search-form'),
        input: document.getElementById('search-input'),
        resultsGrid: document.getElementById('results-grid'),
        resultsCount: document.getElementById('results-count'),
        sortSelect: document.getElementById('sort-select'),
        filters: {
            cuisine: document.getElementById('cuisine-filter'),
            meal: document.getElementById('meal-filter'),
            diet: document.getElementById('diet-filter'),
            time: document.getElementById('time-filter'),
            allergens: document.querySelectorAll('input[name="allergens"]')
        }
    };
}

function displayResults(recipes) {
    const resultsGrid = document.getElementById('results-grid');
    const resultsCount = document.getElementById('results-count');
    
    resultsGrid.innerHTML = '';
    currentResults = recipes;

    if (recipes.length === 0) {
        resultsGrid.innerHTML = `
            <div class="no-results">
                <h3>No recipes found</h3>
                <p>Try adjusting your search terms or filters</p>
            </div>
        `;
        return;
    }

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <div class="recipe-image">
                <img src="${recipe.image || '../LOGO/recipe-placeholder.svg'}" alt="${recipe.title}">
            </div>
            <div class="recipe-content">
                <h3>${recipe.title}</h3>
                <p>${recipe.description || 'No description available'}</p>
                <div class="recipe-meta">
                    <span><i class="meta-icon">⏱️</i> ${recipe.cookTime || 0} mins</span>
                    <span><i class="meta-icon">👨‍🍳</i> ${recipe.difficulty || 'Easy'}</span>
                    ${recipe.rating ? `<span><i class="meta-icon">⭐</i> ${recipe.rating}</span>` : ''}
                </div>
                ${recipe.dietaryCategories && recipe.dietaryCategories.length > 0 ? `
                    <div class="dietary-tags">
                        ${recipe.dietaryCategories.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `recipe.html?id=${recipe.id}`;
        });

        resultsGrid.appendChild(card);
    });

    resultsCount.textContent = `Found ${recipes.length} recipes`;
}

function setupEventListeners() {
    const { form, sortSelect, filters } = window.searchComponents;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch();
    });
    
    sortSelect.addEventListener('change', sortResults);
    
    // Add event listeners to filter elements
    if (filters.cuisine) filters.cuisine.addEventListener('change', performSearch);
    if (filters.meal) filters.meal.addEventListener('change', performSearch);
    if (filters.diet) filters.diet.addEventListener('change', performSearch);
    if (filters.time) filters.time.addEventListener('change', performSearch);
    
    if (filters.allergens) {
        filters.allergens.forEach(input => {
            input.addEventListener('change', performSearch);
        });
    }
}

function handleInitialSearch() {
    const { input } = window.searchComponents;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('q')) {
        input.value = urlParams.get('q');
        performSearch();
    } else {
        loadRecentRecipes();
    }
}

async function loadRecentRecipes() {
    try {
        showLoading();
        // Use trending recipes from MealDB as recent recipes
        const recipes = await fetchTrendingRecipes();
        hideLoading();
        
        if (recipes && recipes.length > 0) {
            displayResults(recipes);
            const resultsCount = document.getElementById('results-count');
            resultsCount.textContent = `Showing ${recipes.length} trending recipes`;
        } else {
            showError('No recipes found');
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
        hideLoading();
        showError('Could not connect to recipe service');
    }
}

async function performSearch() {
    const { input: searchInput } = window.searchComponents;
    const query = searchInput.value.trim().replace(/[<>"'%;()&+]/g, '');
    
    if (query.length > 100) {
        showError('Search query too long');
        return;
    }
    
    showLoading();
    
    try {
        // Use MealDB search function
        const recipes = await searchRecipes(query);
        
        // Apply filters to the results
        const filteredRecipes = applyFilters(recipes);
        
        hideLoading();
        displayResults(filteredRecipes);
        
        // Update URL with search query
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        window.history.pushState({}, '', url);
    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        showError('Failed to search recipes');
    }
}

function applyFilters(recipes) {
    const { filters } = window.searchComponents;
    
    return recipes.filter(recipe => {
        // Apply category filter (previously cuisine filter)
        if (filters.cuisine && filters.cuisine.value && 
            recipe.strCategory && 
            recipe.strCategory.toLowerCase() !== filters.cuisine.value.toLowerCase()) {
            return false;
        }
        
        // Apply meal type filter
        if (filters.meal && filters.meal.value && 
            recipe.strCategory && 
            recipe.strCategory.toLowerCase() !== filters.meal.value.toLowerCase()) {
            return false;
        }
        
        // Apply dietary filter
        if (filters.diet && filters.diet.value && 
            (!recipe.dietaryCategories || 
             !recipe.dietaryCategories.some(cat => cat.toLowerCase() === filters.diet.value.toLowerCase()))) {
            return false;
        }
        
        // Apply cooking time filter
        if (filters.time && filters.time.value) {
            const maxTime = parseInt(filters.time.value);
            if (!isNaN(maxTime) && recipe.cookTime > maxTime) {
                return false;
            }
        }
        
        // Apply allergen filters
        if (filters.allergens) {
            const selectedAllergens = Array.from(filters.allergens)
                .filter(input => input.checked)
                .map(input => input.value.toLowerCase());
            
            if (selectedAllergens.length > 0 && recipe.ingredients) {
                for (const allergen of selectedAllergens) {
                    if (recipe.ingredients.some(ing => 
                        ing.name.toLowerCase().includes(allergen))) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    });
}

function sortResults() {
    const { sortSelect } = window.searchComponents;
    const sortBy = sortSelect.value;
    
    if (currentResults.length === 0) return;
    
    let sortedResults = [...currentResults];
    
    switch (sortBy) {
        case 'rating':
            sortedResults.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
            break;
        case 'time':
            sortedResults.sort((a, b) => (a.cookTime || 999) - (b.cookTime || 999));
            break;
        // Default is relevance, which is the original order
    }
    
    displayResults(sortedResults);
}

function showLoading() {
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '<div class="loading-spinner">Loading recipes...</div>';
}

function hideLoading() {
    // Loading is hidden when results are displayed
}

function showError(message) {
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = `
        <div class="no-results">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function hasActiveFilters() {
    const { filters } = window.searchComponents;
    return (
        (filters.cuisine && filters.cuisine.value !== '') ||
        (filters.meal && filters.meal.value !== '') ||
        (filters.diet && filters.diet.value !== '') ||
        (filters.time && filters.time.value !== '') ||
        (filters.allergens && Array.from(filters.allergens).some(input => input.checked))
    );
}
    
    function displayResults(recipes) {
        hideLoading();
        resultsCount.textContent = `${recipes.length} results found`;
        
        if (recipes.length === 0) {
            resultsGrid.innerHTML = `
                <div class="no-results">
                    <h3>No recipes found</h3>
                    <p>Try adjusting your search terms or filters</p>
                </div>
            `;
            return;
        }
        
        resultsGrid.innerHTML = recipes.map(recipe => `
            <a href="recipe.html?id=${recipe.id}" class="recipe-card">
                <img src="${recipe.image || '../LOGO/recipe-placeholder.svg'}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span><i class="meta-icon">⏱️</i> ${recipe.cookTime ? recipe.cookTime + ' min' : 'Quick'}</span>
                        <span><i class="meta-icon">👨‍🍳</i> ${recipe.difficulty || 'Easy'}</span>
                        ${recipe.rating ? `<span><i class="meta-icon">⭐</i> ${recipe.rating}</span>` : ''}
                    </div>
                </div>
            </a>
        `).join('');
    }
    

    function sortResults() {
        const cards = Array.from(resultsGrid.querySelectorAll('.recipe-card'));
        const sortBy = sortSelect.value;
        
        if (cards.length === 0) return;
        resultsGrid.innerHTML = '';
        cards.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return getRating(b) - getRating(a);
                case 'time':
                    return getCookTime(a) - getCookTime(b);
                default:
                    return 0;
            }
        });
        cards.forEach(card => resultsGrid.appendChild(card));
    }
    
    function getRating(element) {
        const ratingEl = element.querySelector('.recipe-meta span:nth-child(3)');
        return ratingEl ? parseFloat(ratingEl.textContent.replace('★ ', '')) || 0 : 0;
    }
    function getCookTime(element) {
        const timeEl = element.querySelector('.recipe-meta span:first-child');
        return timeEl ? parseInt(timeEl.textContent) || 99 : 99;
    }
    function getSelectedAllergens() {
        const { filters } = window.searchComponents;
        return Array.from(filters.allergens)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }

    function setupEventListeners() {
        const { form, input, sortSelect, filters } = window.searchComponents;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });
        
        sortSelect.addEventListener('change', sortResults);
        
        Object.values(filters).forEach(filter => {
            if (filter instanceof NodeList) {
                filter.forEach(input => input.addEventListener('change', performSearch));
            } else {
                filter.addEventListener('change', performSearch);
            }
        });
    }

    function handleInitialSearch() {
        const { input } = window.searchComponents;
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('q')) {
            input.value = urlParams.get('q');
            performSearch();
        } else {
            loadRecentRecipes();
        }
    }
	
    function showError(message) {
        hideLoading();
        resultsGrid.innerHTML = `
            <div class="no-results">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
;