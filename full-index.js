import { getAllRecipes } from './recipeService.js';

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const officialRecipesContent = document.getElementById('official-recipes-content');
    const communityRecipesContent = document.getElementById('community-recipes-content');
    const officialAlphabet = document.getElementById('official-alphabet');
    const communityAlphabet = document.getElementById('community-alphabet');
    let officialRecipes = [];
    let communityRecipes = [];
    setupEventListeners();
    loadRecipes();
    
    function setupEventListeners() 
	{
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                switchTab(tab);
            });
        });
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterRecipes, 300));
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                sortRecipes(sortSelect.value);
            });
        }
    }
    
    async function loadRecipes() 
	{
        try {
            officialRecipesContent.innerHTML = '<div class="loading-spinner">Loading recipes...</div>';
            communityRecipesContent.innerHTML = '<div class="loading-spinner">Loading recipes...</div>';
            const officialResult = await fetchOfficialRecipes();
            officialRecipes = officialResult;

            const communityResult = await fetchCommunityRecipes();
            communityRecipes = communityResult;
            const officialByLetter = groupRecipesByLetter(officialRecipes);
            const communityByLetter = groupRecipesByLetter(communityRecipes);
            displayRecipes('official');
            displayRecipes('community');

            generateAlphabetIndex(officialAlphabet, officialByLetter);
            generateAlphabetIndex(communityAlphabet, communityByLetter);
            updateStats(officialRecipes, communityRecipes);
        } catch (error) {
            console.error('Error loading recipes:', error);
            showError('Failed to load recipes. Please try again later.');
        }
    }
    

    function groupRecipesByLetter(recipeList) 
	{
        const grouped = {};
        const sortedRecipes = [...recipeList].sort((a, b) => 
            a.title.localeCompare(b.title)
        );
        sortedRecipes.forEach(recipe => {
            const firstLetter = recipe.title.charAt(0).toUpperCase();
            
            if (!grouped[firstLetter]) {
                grouped[firstLetter] = [];
            }
            
            grouped[firstLetter].push(recipe);
        });
        
        return grouped;
    }
    
    function displayRecipes(tab) 
	{
        const container = tab === 'official' ? officialRecipesContent : communityRecipesContent;
        const recipes = tab === 'official' ? officialRecipes : communityRecipes;
        
        if (recipes.length === 0) {
            container.innerHTML = '<p class="empty-message">No recipes found.</p>';
            return;
        }

        const groupedRecipes = groupRecipesByLetter(recipes);
        let html = '';
        
        Object.keys(groupedRecipes).sort().forEach(letter => {
            html += `
                <div class="letter-section" id="${tab}-${letter}">
                    <h2 class="letter-heading">${letter}</h2>
                    <div class="recipe-links">
                        ${groupedRecipes[letter].map(recipe => `
                            <a href="recipe.html?id=${recipe.id || recipe._id}" class="recipe-link">
                                <span class="recipe-link-title">${recipe.title}</span>
                                <span class="recipe-meta">
                                    <span>⭐ ${recipe.rating.toFixed(1)}</span>
                                    <span>⏱️ ${recipe.cookTime + recipe.prepTime} min</span>
                                </span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    function generateAlphabetIndex(container, groupedRecipes) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let html = '';
        
        for (let i = 0; i < alphabet.length; i++) {
            const letter = alphabet[i];
            const hasRecipes = groupedRecipes[letter] && groupedRecipes[letter].length > 0;
            const tabId = container.id.includes('official') ? 'official' : 'community';
            
            if (hasRecipes) {
                html += `<a href="#${tabId}-${letter}" class="letter-link active">${letter}</a>`;
            } else {
                html += `<span class="letter-link disabled">${letter}</span>`;
            }
        }
        
        container.innerHTML = html;
    }
	
    function switchTab(tab) 
	{
        tabButtons.forEach(button => {
            if (button.dataset.tab === tab) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        document.getElementById('official-recipes').classList.toggle('active', tab === 'official');
        document.getElementById('community-recipes').classList.toggle('active', tab === 'community');
    }
    
    function filterRecipes(event) 
	{
        const searchTerm = event.target.value.toLowerCase();
        const filteredOfficial = officialRecipes.filter(recipe => 
            recipe.title.toLowerCase().includes(searchTerm)
        );
        const filteredCommunity = communityRecipes.filter(recipe => 
            recipe.title.toLowerCase().includes(searchTerm)
        );
        officialRecipes = filteredOfficial;
        communityRecipes = filteredCommunity;
        const officialByLetter = groupRecipesByLetter(filteredOfficial);
        const communityByLetter = groupRecipesByLetter(filteredCommunity);

        displayRecipes('official');
        displayRecipes('community');
        generateAlphabetIndex(officialAlphabet, officialByLetter);
        generateAlphabetIndex(communityAlphabet, communityByLetter);
    }
    

    function sortRecipes(sortMethod) {
        if (sortMethod === 'az') {
            officialRecipes.sort((a, b) => a.title.localeCompare(b.title));
            communityRecipes.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortMethod === 'za') {
            officialRecipes.sort((a, b) => b.title.localeCompare(a.title));
            communityRecipes.sort((a, b) => b.title.localeCompare(a.title));
        } else if (sortMethod === 'newest') {
            officialRecipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            communityRecipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortMethod === 'popular') {
            officialRecipes.sort((a, b) => b.rating - a.rating);
            communityRecipes.sort((a, b) => b.rating - a.rating);
        }
        displayRecipes('official');
        displayRecipes('community');
    }
    
    function updateStats(officialRecipes, communityRecipes) 
	{
        const totalRecipes = officialRecipes.length + communityRecipes.length;
        const officialCount = officialRecipes.length;
        const communityCount = communityRecipes.length;
        
        document.getElementById('total-recipes').textContent = totalRecipes;
        document.getElementById('official-count').textContent = officialCount;
        document.getElementById('community-count').textContent = communityCount;
    }
    
    function showError(message) {
        officialRecipesContent.innerHTML = `<p class="error-message">${message}</p>`;
        communityRecipesContent.innerHTML = `<p class="error-message">${message}</p>`;
    }
    
    function debounce(func, wait) 
	{
        let timeout;
        return function executedFunction(...args) 
		{
            const later = () => 
			{
                clearTimeout(timeout);
                func(...args);
            };
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async function fetchOfficialRecipes() 
    {
        try {
            const filters = {
                isOfficial: true,
                limit: 100
            };
            
            const result = await getAllRecipes(filters);
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch official recipes');
            }
            
            return result.recipes;
        } catch (error) {
            console.error('Error fetching official recipes:', error);
            return [];
        }
    }

    async function fetchCommunityRecipes() 
    {
        try {
            const filters = {
                isOfficial: false,
                limit: 100
            };
            
            const result = await getAllRecipes(filters);
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch community recipes');
            }
            
            return result.recipes;
        } catch (error) {
            console.error('Error fetching community recipes:', error);
            return [];
        }
    }
}); 