document.addEventListener('DOMContentLoaded', () => 
{
    // Load hero recipe and initial category recipes
    loadHeroRecipe();
    loadCategoryRecipes('all');
    initializeFilters();
});

async function loadHeroRecipe() {
    try {
        const recipes = await fetchFeaturedRecipes();
        if (recipes && recipes.length > 0) {
            // Select a random featured recipe
            const randomIndex = Math.floor(Math.random() * recipes.length);
            const heroRecipe = recipes[randomIndex];
            
            // Update hero section with recipe content
            const heroSection = document.querySelector('.hero-section');
            heroSection.innerHTML = `
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    <h1 class="hero-title">${heroRecipe.title}</h1>
                    <p class="hero-subtitle">${heroRecipe.description || 'Discover this amazing recipe'}</p>
                </div>
            `;
            
            // Add click handler to hero section
            heroSection.style.cursor = 'pointer';
            heroSection.addEventListener('click', () => {
                window.location.href = `recipes.html?id=${heroRecipe.id}`;
            });
            
            // Set background image if available
            if (heroRecipe.image) {
                heroSection.style.backgroundImage = `url(${heroRecipe.image})`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
            }
        }
    } catch (error) {
        console.error('Error loading hero recipe:', error);
    }
}

async function loadCategoryRecipes(filter) {
    try {
        const recipes = await fetchTrendingRecipes();
        const recommendedRecipes = await fetchRecommendedRecipes();
        const featuredRecipes = await fetchFeaturedRecipes();
        
        // Display recipes for each section
        displayRecipes('trending-today', filterRecipesByCategory(recipes, filter));
        displayRecipes('check-these-out', filterRecipesByCategory(featuredRecipes, filter));
        displayRecipes('recommended-for-you', filterRecipesByCategory(recommendedRecipes, filter));
    } catch (error) {
        console.error('Error loading category recipes:', error);
        showError('recipe-sections');
    }
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => 
		{
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.dataset.filter;
            filterRecipes(filter);
        });
    });
}

async function loadTrendingRecipes() 
{
    try {
        const recipes = await fetchTrendingRecipes();
        displayRecipes('trending-recipes', recipes);
    } catch (error) {
        console.error('Error loading trending recipes:', error);
        showError('trending-recipes');
    }
}

async function loadFeaturedRecipes() 
{
    try {
        const recipes = await fetchFeaturedRecipes();
        displayRecipes('featured-recipes', recipes);
    } catch (error) {
        console.error('Error loading featured recipes:', error);
        showError('featured-recipes');
    }
}

async function loadRecommendedRecipes() 
{
    try {
        const recipes = await fetchRecommendedRecipes();
        displayRecipes('recommended-recipes', recipes);
    } catch (error) {
        console.error('Error loading recommended recipes:', error);
        showError('recommended-recipes');
    }
}

function displayRecipes(containerId, recipes) 
{
    const container = document.getElementById(containerId);
    
    container.innerHTML = recipes.map(recipe => {
        const categories = [
            ...(recipe.categories || []),
            ...(recipe.dietaryCategories || []),
            ...(recipe.mealTypes || [])
        ];
        
        return `
        <div class="recipe-card" 
             data-categories="${categories.join(' ')}" 
             data-meal-types="${recipe.mealTypes?.join(' ') || ''}" 
             data-dietary="${recipe.dietaryCategories?.join(' ') || ''}" 
             data-difficulty="${recipe.difficulty?.toLowerCase() || 'medium'}"
             data-recipe-id="${recipe.id}">
            <img src="${recipe.image || '../LOGO/recipe-placeholder.svg'}" 
                 alt="${recipe.title}" 
                 class="recipe-image">
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description || ''}</p>
                <div class="recipe-tags">
                    ${categories.map(tag => `<span class="recipe-tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // Add click event listeners to all recipe cards in this container
    container.querySelectorAll('.recipe-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const recipeId = card.dataset.recipeId;
            if (recipeId) {
                window.location.href = `recipes.html?id=${recipeId}`;
            }
        });
    });
}

function filterRecipes(filter) {
    // Load new recipes for the selected category
    loadCategoryRecipes(filter);
}

function filterRecipesByCategory(recipes, filter) {
    if (filter === 'all') return recipes;
    
    return recipes.filter(recipe => {
        const categories = [
            ...(recipe.categories || []),
            ...(recipe.dietaryCategories || []),
            ...(recipe.mealTypes || [])
        ];
        
        // Quick & easy filter
        if (filter === 'quick') {
            return (recipe.cookTime || 0) <= 30;
        }
        
        // Vegetarian filter
        if (filter === 'vegetarian') {
            return recipe.dietaryCategories?.includes('vegetarian');
        }
        
        // Trending and popular filters
        if (filter === 'trending' || filter === 'popular') {
            return (recipe.rating || 0) >= 4.0;
        }
        
        // Category match
        return categories.includes(filter);
    });
}

function showError(containerId) 
{
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="error-message">
            Failed to load recipes. Please try again later.
        </div>
    `;
}
