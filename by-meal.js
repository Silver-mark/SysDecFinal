import { getAllRecipes } from './recipeService.js';

document.addEventListener('DOMContentLoaded', () => {
    const categoryCards = document.querySelectorAll('.category-card');
    const recipesGrid = document.getElementById('recipe-grid');
    const sectionTitle = document.querySelector('.section-title');

    // Initialize with breakfast recipes
    const defaultCategory = 'breakfast';
    document.querySelector(`[data-category="${defaultCategory}"]`).classList.add('active');
    loadRecipesByMeal(defaultCategory);

    // Add click handlers to category cards
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            // Update active state
            categoryCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            // Load recipes and scroll to section
            loadRecipesByMeal(category);
            document.getElementById('recipe-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    async function loadRecipesByMeal(category) {
        try {
            // Show loading state
            recipesGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading recipes...</p></div>';
            
            const recipes = await fetchRecipesByMeal(category);
            
            if (!recipes || recipes.length === 0) {
                recipesGrid.innerHTML = `
                    <div class="no-results">
                        <p>No recipes found for ${category}.</p>
                        <p>Be the first to add a recipe!</p>
                    </div>`;
                return;
            }
            
            displayRecipes(recipes);
            updateSectionTitle(category);
        } catch (error) {
            console.error('Error loading recipes by meal:', error);
            showError('Failed to load recipes. Please try again later.');
        }
    }

    function displayRecipes(recipes) {
        recipesGrid.innerHTML = '';
        
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            
            recipeCard.innerHTML = `
                <img src="${recipe.image || '../LOGO/recipe-placeholder.svg'}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-description">${recipe.description || 'A delicious recipe'}</p>
                    <div class="recipe-meta">
                        <span class="meta-item"><i class="fas fa-clock"></i> ${recipe.cookTime || '30'} min</span>
                        <span class="meta-item"><i class="fas fa-utensils"></i> ${recipe.difficulty || 'Easy'}</span>
                        <span class="meta-item"><i class="fas fa-star"></i> ${recipe.rating || '4.5'}</span>
                    </div>
                </div>
            `;

            recipeCard.addEventListener('click', () => {
                window.location.href = `recipe.html?id=${recipe.id || recipe._id}`;
            });
            
            recipesGrid.appendChild(recipeCard);
        });
    }
    function updateSectionTitle(category) {
        const titles = {
            breakfast: 'Breakfast Recipes',
            lunch: 'Lunch Recipes',
            dinner: 'Dinner Recipes',
            snacks: 'Snack Recipes',
            desserts: 'Dessert Recipes',
            drinks: 'Drink Recipes'
        };
        
        sectionTitle.textContent = titles[category] || 'Recipes by Meal Type';
    }
    function showError(message) {
        recipesGrid.innerHTML = `<p class="error-message">${message}</p>`;
    }
    async function fetchRecipesByMeal(category) {
        const mealTypeMap = {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snack',
            desserts: 'Dessert',
            drinks: 'Drink'
        };
        
        const mealType = mealTypeMap[category] || '';
        const filters = {
            mealType: mealType,
            limit: 12,
            sort: 'rating'
        };

        const result = await getAllRecipes(filters);
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch recipes');
        }
        
        return result.recipes;
    }
});