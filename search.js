import { getAllRecipes } from './recipeService.js';
import { searchLocalRecipes } from './recipeDBService.js';

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

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <div class="recipe-image">
                <img src="${recipe.image || '../images/default-recipe.jpg'}" alt="${recipe.title}">
                ${recipe.source === 'local' ? '<span class="source-badge local">Local</span>' : '<span class="source-badge external">External</span>'}
            </div>
            <div class="recipe-content">
                <h3>${recipe.title}</h3>
                <p>${recipe.description || 'No description available'}</p>
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.cookTime + recipe.prepTime || 0} mins</span>
                    <span><i class="fas fa-utensils"></i> ${recipe.difficulty || 'Easy'}</span>
                </div>
                ${recipe.dietaryCategories ? `
                    <div class="dietary-tags">
                        ${recipe.dietaryCategories.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `/pages/recipe.html?id=${recipe.id}&source=${recipe.source}`;
        });

        resultsGrid.appendChild(card);
    });

    resultsCount.textContent = `Found ${recipes.length} recipes`;
}

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsGrid = document.getElementById('results-grid');
    const resultsCount = document.getElementById('results-count');
    const sortSelect = document.getElementById('sort-select');
    const filters = {
        cuisineFilter: document.getElementById('cuisine-filter'),
        mealFilter: document.getElementById('meal-filter'),
        dietFilter: document.getElementById('diet-filter'),
        timeFilter: document.getElementById('time-filter'),
        allergenInputs: document.querySelectorAll('input[name="allergens"]')
    };
	
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('q')) {
        searchInput.value = urlParams.get('q');
        performSearch();
    } else {
        loadRecentRecipes();
    }

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch();
    });
    
    sortSelect.addEventListener('change', () => {
        sortResults();
    });
    filters.cuisineFilter.addEventListener('change', performSearch);
    filters.mealFilter.addEventListener('change', performSearch);
    filters.dietFilter.addEventListener('change', performSearch);
    filters.timeFilter.addEventListener('change', performSearch);
    
    filters.allergenInputs.forEach(input => {
        input.addEventListener('change', performSearch);
    });
    
    async function loadRecentRecipes() {
        try {
            const result = await getAllRecipes({ sort: 'latest', limit: 12 });
            
            if (result.success) {
                displayResults(result.recipes);
                resultsCount.textContent = `Showing ${result.recipes.length} recent recipes`;
            } else {
                showError('Failed to load recipes');
            }
        } catch (error) {
            console.error('Error loading recipes:', error);
            showError('Could not connect to recipe service');
        }
    }

    async function performSearch() {
        const { input: searchInput } = window.searchComponents;
        const searchAttempts = parseInt(localStorage.getItem('searchAttempts') || 0);
        
        if(searchAttempts > 10) {
            showError('Search rate limit exceeded - please try again later');
            return;
        }
        
        localStorage.setItem('searchAttempts', searchAttempts + 1);
        const query = searchInput.value.trim().replace(/[<>"'%;()&+]/g, '');
        
        if(query.length > 100 || query.match(/\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|SELECT|UPDATE|UNION)\b/i)) {
            showError('Invalid search query');
            return;
        }
        showLoading();
        
        try {
            const filters = getFilters();
            const [localResults, externalResults] = await Promise.all([
                searchLocalRecipes(query),
                getAllRecipes({ ...filters, query })
            ]);

            const combinedResults = [];
            const seenIds = new Set();

            // Add local results first
            if (localResults.success && localResults.recipes) {
                localResults.recipes.forEach(recipe => {
                    if (!seenIds.has(recipe.id)) {
                        combinedResults.push({ ...recipe, source: 'local' });
                        seenIds.add(recipe.id);
                    }
                });
            }

            // Add external results
            if (externalResults.success && externalResults.recipes) {
                externalResults.recipes.forEach(recipe => {
                    if (!seenIds.has(recipe.id)) {
                        combinedResults.push({ ...recipe, source: 'external' });
                        seenIds.add(recipe.id);
                    }
                });
            }

            hideLoading();
            displayResults(combinedResults);
            
        } catch (error) {
            console.error('Search error:', error);
            hideLoading();
            showError('Failed to search recipes');
        }
        
        if (!query && !hasActiveFilters()) {
            loadRecentRecipes();
            return;
        }
        
        try {
            const filterParams = {
                query: query,
                cuisineType: filters.cuisineFilter.value,
                category: filters.mealFilter.value,
                dietary: filters.dietFilter.value,
                cookTime: filters.timeFilter.value,
                allergens: getSelectedAllergens()
            };
			
            Object.keys(filterParams).forEach(key => {
                if (!filterParams[key] || 
                    (Array.isArray(filterParams[key]) && filterParams[key].length === 0)) {
                    delete filterParams[key];
                }
            });
            const result = await getAllRecipes(filterParams);
            
            if (result.success) {
                displayResults(result.recipes);
            } else {
                showError(result.message || 'Failed to search recipes');
            }
        } catch (error) {
            console.error('Search error:', error);
            showError('Failed to perform search. Please try again.');
        }
    }
    
    function hasActiveFilters() {
        const { filters } = window.searchComponents;
        return (
            filters.cuisine.value !== '' ||
            filters.meal.value !== '' ||
            filters.diet.value !== '' ||
            filters.time.value !== '' ||
            Array.from(filters.allergens).some(input => input.checked)
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
});