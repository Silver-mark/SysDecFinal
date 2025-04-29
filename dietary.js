import { getAllRecipes } from './recipeService.js';

document.addEventListener('DOMContentLoaded', () => {
    const categoryCards = document.querySelectorAll('.category-card');
    const recipesGrid = document.getElementById('recipe-grid');
    const sectionTitle = document.getElementById('section-title');
    const filterSelect = document.getElementById('filter-select');
    let currentCategory = 'vegetarian';
    let currentFilters = {};
    loadRecipesByDiet(currentCategory, currentFilters);
    categoryCards.forEach(card => {
        card.addEventListener('click', async () => {
            const category = card.dataset.category;
            categoryCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentCategory = category;
            updateFilters();
            await loadRecipesByDiet(category, currentFilters);
            document.getElementById('recipe-section').scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    if (filterSelect) {
        filterSelect.addEventListener('change', async () => {
            updateFilters();
            await loadRecipesByDiet(currentCategory, currentFilters);
        });
    }

    function updateFilters() {
        currentFilters = {};
        
        if (filterSelect) {
            const sortValue = filterSelect.value;
            
            if (sortValue === 'rating') {
                currentFilters.sort = 'rating';
            } else if (sortValue === 'time') {
                currentFilters.sort = 'cookTime';
            } else if (sortValue === 'newest') {
                currentFilters.sort = 'createdAt';
            }
        }
    }

    async function loadRecipesByDiet(category, filters) {
        try {
            recipesGrid.innerHTML = '<div class="loading-spinner">Loading recipes...</div>';
            
            const recipes = await fetchRecipesByDiet(category, filters);
            
            if (recipes.length === 0) {
                recipesGrid.innerHTML = '<p class="no-results">No recipes found for this dietary preference.</p>';
                return;
            }
            
            displayRecipes(recipes);
            updateSectionTitle(category);
        } catch (error) {
            console.error('Error loading recipes by diet:', error);
            showError('Failed to load recipes. Please try again later.');
        }
    }

    function displayRecipes(recipes) {
        recipesGrid.innerHTML = '';
        
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            const tagsHTML = generateTags(recipe);
            
            recipeCard.innerHTML = `
                <img src="${recipe.image || '../LOGO/recipe-placeholder.svg'}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span class="meta-item"><i class="meta-icon">⭐</i> ${recipe.rating.toFixed(1)}</span>
                        <span class="meta-item"><i class="meta-icon">⏱️</i> ${recipe.cookTime + recipe.prepTime} min</span>
                        <span class="meta-item"><i class="meta-icon">👨‍🍳</i> ${recipe.difficulty || 'Easy'}</span>
                    </div>
                    <div class="recipe-tags">
                        ${tagsHTML}
                    </div>
                </div>
            `;
            recipeCard.addEventListener('click', () => {
                window.location.href = `recipe.html?id=${recipe.id || recipe._id}`;
            });
            
            recipesGrid.appendChild(recipeCard);
        });

        function generateTags(recipe) {
            const tags = [];
            
            if (recipe.dietaryCategories && recipe.dietaryCategories.length > 0) {
                tags.push(...recipe.dietaryCategories);
            }
            
            if (recipe.categories && recipe.categories.length > 0) {
                tags.push(...recipe.categories.slice(0, 2));
            }
            // Limit to 3 tags
            const limitedTags = [...new Set(tags)].slice(0, 3);
            
            return limitedTags.map(tag => `<span class="recipe-tag">${tag}</span>`).join('');
        }
    }


    function updateSectionTitle(category) {
        const titles = {
            vegetarian: 'Vegetarian Recipes',
            vegan: 'Vegan Recipes',
            glutenFree: 'Gluten-Free Recipes',
            dairyFree: 'Dairy-Free Recipes',
            keto: 'Keto Recipes',
            paleo: 'Paleo Recipes',
            lowCarb: 'Low-Carb Recipes'
        };
        
        sectionTitle.textContent = titles[category] || 'Dietary Recipes';
    }

    function showError(message) {
        recipesGrid.innerHTML = `<p class="error-message">${message}</p>`;
    }

    async function fetchRecipesByDiet(category, filters) 
    {
        // Map data-category attributes to API dietary categories
        const dietaryMap = {
            vegetarian: 'vegetarian',
            vegan: 'vegan',
            'gluten-free': 'gluten-free',
            'dairy-free': 'dairy-free',
            keto: 'keto',
            paleo: 'paleo'
        };
        
        const dietaryCategory = dietaryMap[category] || '';
        const apiFilters = {
            ...filters,
            dietaryCategory: dietaryCategory,
            limit: 12
        };
        const result = await getAllRecipes(apiFilters);
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch recipes');
        }
        
        return result.recipes;
    }
});