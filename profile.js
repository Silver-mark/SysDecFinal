

document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page loaded');

    
    // Check if user is logged in
    if (!localStorage.getItem('userId') || !localStorage.getItem('authToken')) {
        console.log('No user ID found, redirecting to signin');
        window.location.href = 'signin.html';
        return;
    }

    // Initialize navigation (if not already handled in navigation.js)
    if (typeof initNavigation === 'function') {
        initNavigation();
    }

    loadUserProfile();
    initializeTabs();
    setupProfileEditButton();
    setupCreateRecipeButton();
    document.getElementById('logout-btn').addEventListener('click', logout);
    loadInitialTab();
});

function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    window.location.href = 'signin.html';
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    if (!tabs || tabs.length === 0) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            if (tabName) {
                activateTab(tab, tabName);
                // Remove the specific favorites check here
            }
        });
    });
}

function loadTabContent(tabName) {
    switch(tabName) {
        case 'favorites':
            loadFavorites();
            break;
        case 'my-recipes':
            loadUserRecipes();
            break;
        case 'meal-plans':
            loadMealPlans();
            break;
    }
}


function activateTab(selectedTab, tabName) {
    // Update tab styles
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    selectedTab.classList.add('active');

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const tabContent = document.getElementById(tabName);
    if (tabContent) {
        tabContent.classList.add('active');
        loadTabContent(tabName);
    }
}

function loadInitialTab() {
    // Get the active tab and load its content
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        const tabName = activeTab.dataset.tab;
        loadTabContent(tabName);
    } else {
        // Default to my-recipes if no tab is active
        loadUserRecipes();
    }
}

// Add this new function to set up the create recipe button
function setupCreateRecipeButton() {
    const createButton = document.getElementById('create-recipe-btn');
    if (createButton) {
        createButton.addEventListener('click', () => {
            window.location.href = 'create-recipe.html';
        });
    }
}

// Modify the displayUserProfile function to handle binary avatar
function displayUserProfile(userData) {
    // Basic profile info
    document.querySelector('.profile-name').textContent = userData.name || 'User';
    document.querySelector('.profile-bio').textContent = userData.bio || 'No bio provided. Click edit to add one.';
    
    // Profile image
    const profileImage = document.querySelector('.profile-avatar');
    if (profileImage) {
        const userId = localStorage.getItem('userId');
        if (userData.hasAvatar) {
            // Set src to the avatar endpoint with cache-busting
            profileImage.src = `/api/users/${userId}/avatar?t=${new Date().getTime()}`;
        } else {
            profileImage.src = 'https://via.placeholder.com/150?text=Profile';
        }
    }
}

// Load user profile data from database
async function loadUserProfile() {
    try {
        const userId = localStorage.getItem('userId');
        const authToken = localStorage.getItem('authToken');
        
        if (!userId || !authToken) {
            window.location.href = 'signin.html';
            return;
        }
        
        console.log('Loading profile for user ID:', userId);
        showLoading('Loading profile...');
        
        // Try to fetch from API with auth token
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        let userData;
        if (response.ok) {
            userData = await response.json();
            console.log('User data received from API:', userData);
            
            // Cache the user data
            localStorage.setItem('userProfile', JSON.stringify(userData));
        } else {
            // Try alternative endpoint
            const altResponse = await fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (altResponse.ok) {
                userData = await altResponse.json();
                localStorage.setItem('userProfile', JSON.stringify(userData));
            } else {
                // Use cached data if available
                const cachedProfile = localStorage.getItem('userProfile');
                if (cachedProfile) {
                    userData = JSON.parse(cachedProfile);
                } else {
                    // Fallback to basic data
                    userData = {
                        _id: userId,
                        name: localStorage.getItem('userName') || 'User',
                        email: localStorage.getItem('userEmail') || '',
                        bio: 'Click edit to update your profile.',
                        profileImage: ''
                    };
                }
                console.log('Using cached/fallback data:', userData);
            }
        }
        
        // Display the user data in the profile
        displayUserProfile(userData);
        hideLoading();
        
    } catch (error) {
        console.error('Error loading profile:', error);
        hideLoading();
        showError('Failed to load profile data');
        
        // Use basic data from localStorage as fallback
        const basicUserData = {
            name: localStorage.getItem('userName') || 'User',
            bio: 'Click edit to update your profile.'
        };
        displayUserProfile(basicUserData);
    }
}


// Set up the edit profile button
function setupProfileEditButton() {
    const editButton = document.getElementById('edit-profile-btn');
    if (editButton) {
        editButton.addEventListener('click', openEditProfileModal);
    }
}

// Open the edit profile modal
function openEditProfileModal() {
    const userId = localStorage.getItem('userId');
    
    // Fetch current user data to pre-fill the form
    fetch(`/api/users/${userId}`)
        .then(response => response.ok ? response.json() : null)
        .then(userData => {
            if (!userData) {
                userData = {
                    name: document.querySelector('.profile-name').textContent,
                    bio: document.querySelector('.profile-bio').textContent,
                    profileImage: document.querySelector('.profile-avatar').src
                };
            }
            
            // Pre-fill the form
            document.getElementById('edit-name').value = userData.name || '';
            document.getElementById('edit-bio').value = userData.bio || '';
            
            // Show the modal
            document.getElementById('edit-profile-modal').classList.add('show');
        })
        .catch(error => {
            console.error('Error fetching user data for edit:', error);
            showError('Could not load user data for editing');
        });
}

// Close the edit profile modal
function closeEditProfileModal() {
    document.getElementById('edit-profile-modal').classList.remove('show');
}

// Handle profile image upload preview
function handleProfileImageChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-image-preview').src = e.target.result;
            document.getElementById('profile-image-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Save profile changes
async function saveProfileChanges(event) {
    event.preventDefault();
    
    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    const name = document.getElementById('edit-name').value;
    const bio = document.getElementById('edit-bio').value;
    
    // Get profile image if uploaded
    let profileImage = null;
    const imageInput = document.getElementById('edit-profile-image');
    if (imageInput && imageInput.files.length > 0) {
        const file = imageInput.files[0];
        profileImage = await readFileAsDataURL(file);
    } else {
        // Keep existing image if no new one is uploaded
        const existingImage = document.querySelector('.profile-avatar');
    }
    
    // Get existing data from localStorage or use empty arrays as fallback
    const existingProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    // Prepare data for API
    const userData = {
        userId,
        name,
        bio,
        avatar: profileImage,
        created: existingProfile.created || [], // Preserve existing data
        mealPlans: existingProfile.mealPlans || [], // Preserve existing data
        rated: existingProfile.rated || [], // Preserve existing data
        favorites: existingProfile.favorites || [], // Preserve existing data
        preferences: existingProfile.preferences || {
            cuisines: [],
            diet: 'none',
            skillLevel: 'beginner',
            cookingTime: 'any'
        }
    };
    
    console.log('Sending profile update:', userData);
    
    try {
        showLoading('Updating profile...');
        
        // Use the alternative endpoint that's already defined in your server
        const response = await fetch('/api/users/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(userData)
        });
        
        console.log('API response status:', response.status);
        
        if (response.ok) {
            const updatedUser = await response.json();
            console.log('Profile updated successfully:', updatedUser);
            
            // Update UI
            displayUserProfile(updatedUser);
            
            // Update localStorage
            localStorage.setItem('userName', name);
            localStorage.setItem('userBio', bio);
            localStorage.setItem('userProfileImage', profileImage);
            
            // Close modal
            closeEditProfileModal();
            hideLoading();
            
            // Use the notification system instead of alert
            const notification = createNotification('Profile updated successfully', 'success');
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.classList.add('show');
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }, 10);
            
            return;
        }
        
        throw new Error('API update failed with status: ' + response.status);
        
    } catch (error) {
        console.error('Error updating profile:', error);
        hideLoading();
        
        // Try fallback endpoint
        try {
            const fallbackResponse = await fetch('/api/users/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    ...userData
                })
            });
            
            if (fallbackResponse.ok) {
                const updatedUser = await fallbackResponse.json();
                displayUserProfile(updatedUser);
                
                localStorage.setItem('userName', name);
                localStorage.setItem('userBio', bio);
                localStorage.setItem('userProfileImage', profileImage);
                
                closeEditProfileModal();
                
                const notification = createNotification('Profile updated successfully', 'success');
                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                        setTimeout(() => notification.remove(), 300);
                    }, 3000);
                }, 10);
                
                return;
            }
        } catch (fallbackError) {
            console.error('Fallback update failed:', fallbackError);
        }
        
        // Update UI locally as last resort
        displayUserProfile({
            name,
            bio,
            profileImage
        });
        
        // Update localStorage
        localStorage.setItem('userName', name);
        localStorage.setItem('userBio', bio);
        localStorage.setItem('userProfileImage', profileImage);
        
        closeEditProfileModal();
        
        // Use the notification system
        const notification = createNotification('Could not save to database. Changes are only visible temporarily.', 'error');
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }, 10);
    }
}

// Add loading indicator functions
function showLoading(message) {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message" id="loading-message"></div>
        `;
        document.body.appendChild(loadingOverlay);
    }
    
    // Set message and show
    document.getElementById('loading-message').textContent = message || 'Loading...';
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Improve error and success messages
function showSuccess(message) {
    const notification = createNotification(message, 'success');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 10);
}

function showError(message) {
    const notification = createNotification(message, 'error');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }, 10);
}

function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    return notification;
}

// Helper function to read file as data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


// Add this function to load user recipes
async function loadUserRecipes() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            return;
        }
        
        try {
            const response = await fetch(`/api/users/recipes/user/${userId}`);
            if (response.ok) {
                const recipes = await response.json();
                displayUserRecipes(recipes);
                return;
            }
        } catch (error) {
            console.error('Error fetching recipes from API:', error);
        }
        
    } catch (error) {
        console.error('Error in loadUserRecipes:', error);
    }
}


function loadUserRecipes() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error('No user ID found');
        return;
    }
    
    const recipesContainer = document.getElementById('user-recipes-container');
    recipesContainer.innerHTML = '<div class="loading-message">Loading your recipes...</div>';
    
    fetch(`/api/recipes/user/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch recipes');
            }
            return response.json();
        })
        .then(recipes => {
            if (recipes.length === 0) {
                recipesContainer.innerHTML = `
                    <div class="no-recipes-message">
                        <p>You haven't created any recipes yet.</p>
                        <button class="create-recipe-btn" onclick="window.location.href='create-recipe.html'">Create Your First Recipe</button>
                    </div>
                `;
                return;
            }
            
            recipesContainer.innerHTML = '';
            
            recipes.forEach(recipe => {
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                
                const imageUrl = recipe.image || 'https://via.placeholder.com/300x200?text=No+Image';
                
                recipeCard.innerHTML = `
                    <div class="recipe-image">
                        <img src="${imageUrl}" alt="${recipe.title}">
                    </div>
                    <div class="recipe-content">
                        <h3 class="recipe-title">${recipe.title}</h3>
                        <div class="recipe-meta">
                            <span>${recipe.difficulty} • ${recipe.cookingTime} mins</span>
                        </div>
                        <p class="recipe-description">${recipe.description}</p>
                        <div class="recipe-actions">
                            <button class="btn view-btn" onclick="window.location.href='recipes.html?id=${recipe._id}'">View</button>
                        <button class="btn edit-btn" onclick="editRecipe('${recipe._id}')">Edit</button>
                        <button class="btn delete-btn" onclick="deleteRecipe('${recipe._id}')">Delete</button>
                        </div>
                    </div>
                `;
                
                recipesContainer.appendChild(recipeCard);
            });
        })
        .catch(error => {
            console.error('Error loading recipes:', error);
            recipesContainer.innerHTML = `
                <div class="loading-message">
                    <p>Failed to load recipes. Please try again later.</p>
                </div>
            `;
        });
}

// Display user recipes in the UI
function displayUserRecipes(recipes) {
    const container = document.getElementById('my-recipes');
    if (!container) return;
    
    if (!recipes || recipes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>You haven't created any recipes yet.</p>
                <button id="create-first-recipe" class="btn primary-btn">Create Your First Recipe</button>
            </div>
        `;
        
        const createButton = document.getElementById('create-first-recipe');
        if (createButton) {
            createButton.addEventListener('click', () => {
                window.location.href = 'create-recipe.html';
            });
        }
        return;
    }
    
    let html = `
        <div class="section-header">
            <h2>Your Recipes</h2>
            <button id="create-recipe-btn" class="btn primary-btn">Create New Recipe</button>
        </div>
        <div class="recipes-grid">
    `;
    
    recipes.forEach(recipe => {
        html += `
            <div class="recipe-card" data-id="${recipe._id}">
                <img src="${recipe.image || 'https://via.placeholder.com/300x200?text=Recipe'}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-description">${recipe.description || 'No description provided.'}</p>
                    <div class="recipe-meta">
                        <span class="recipe-time">${recipe.cookingTime || 0} mins</span>
                        <span class="recipe-difficulty">${recipe.difficulty || 'Easy'}</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="btn view-btn" onclick="window.location.href='recipes.html?id=${recipe._id}'">View</button>
                        <button class="btn edit-btn" onclick="editRecipe('${recipe._id}')">Edit</button>
                        <button class="btn delete-btn" onclick="deleteRecipe('${recipe._id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Set up the create recipe button again
    setupCreateRecipeButton();
}

// Add this new function to handle recipe editing
function editRecipe(recipeId) {
    window.location.href = `create-recipe.html?edit=${recipeId}`;
}

async function loadMealPlans() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await fetch(`/api/users/${userId}/meal-plans`);
        if (!response.ok) throw new Error('Failed to load meal plans');
        
        const mealPlans = await response.json();
        displayMealPlans(mealPlans);
    } catch (error) {
        console.error('Error loading meal plans:', error);
        document.getElementById('meal-plans-grid').innerHTML = 
            '<p class="error-message">Failed to load meal plans. Please try again later.</p>';
    }
}

function displayMealPlans(mealPlans) {
    const container = document.getElementById('meal-plans-grid');
    if (!mealPlans || mealPlans.length === 0) {
        container.innerHTML = '<p>No meal plans found. Create your first one!</p>';
        return;
    }

    container.innerHTML = mealPlans.map(plan => `
        <div class="meal-plan-card">
            <h3>${plan.planName}</h3>
            <p>${plan.description || 'No description'}</p>
            <div class="meal-plan-days">
                ${Object.keys(plan.days).map(day => `
                    <div class="meal-plan-day">
                        <h4>${day.charAt(0).toUpperCase() + day.slice(1)}</h4>
                        <p>${plan.days[day].meal || 'No meal planned'}</p>
                    </div>
                `).join('')}
            </div>
            <div class="meal-plan-actions">
                <button class="edit-meal-plan-btn" data-id="${plan._id}">Edit</button>
                <button class="delete-meal-plan-btn" data-id="${plan._id}">Delete</button>
            </div>
        </div>
    `).join('');

    // Add event listeners to all edit buttons
    document.querySelectorAll('.edit-meal-plan-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const planId = button.dataset.id;
            window.location.href = `meal-planner.html?id=${planId}`;
        });
    });
        // Add delete button event listeners
        document.querySelectorAll('.delete-meal-plan-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const mealPlanId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this meal plan?')) {
                    try {
                        const response = await fetch(`/api/meal-plans/${mealPlanId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                userId: localStorage.getItem('userId')
                            })
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to delete meal plan');
                        }
                        
                        const result = await response.json();
                        console.log('Delete result:', result);
                        
                        // Reload the meal plans
                        await loadMealPlans();
                        showSuccess('Meal plan deleted successfully');
                    } catch (error) {
                        console.error('Error deleting meal plan:', error);
                        showError(error.message || 'Failed to delete meal plan');
                    }
                }
            });
        });
}
// Load user favorites
async function loadFavorites() {
    try {
        const userId = localStorage.getItem('userId');
        const authToken = localStorage.getItem('authToken');
        const favoritesContainer = document.getElementById('favorites-container');
        
        if (!userId || !authToken) {
            window.location.href = 'signin.html';
            return;
        }

        favoritesContainer.innerHTML = '<div class="loading-spinner"></div>';
        
        // First fetch user data to get favorites array
        const userResponse = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        const favorites = userData.favorites || userData.profileData?.favorites || [];
        
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = '<div class="empty-message">No favorite recipes found</div>';
            return;
        }

        // Fetch details for each favorite recipe
        const recipePromises = favorites.map(id => 
            fetch(`/api/recipes/${id}`)
                .then(res => res.ok ? res.json() : null)
                .catch(() => null)
        );
        
        const recipes = (await Promise.all(recipePromises)).filter(Boolean);
        
        if (recipes.length === 0) {
            favoritesContainer.innerHTML = '<div class="empty-message">No favorite recipes found</div>';
            return;
        }
        
        // Display the recipes
        favoritesContainer.innerHTML = '';
        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <div class="recipe-card-image">
                    <img src="${recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                         alt="${recipe.title}">
                </div>
                <div class="recipe-card-content">
                    <h3 class="recipe-card-title">${recipe.title}</h3>
                    <p class="recipe-card-description">${recipe.description || ''}</p>
                </div>
            `;
            favoritesContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading favorites:', error);
        document.getElementById('favorites-container').innerHTML = 
            '<p class="error-message">Failed to load favorite recipes</p>';
    }
}

function displayFavoriteRecipes(recipes) {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    if (recipes.length === 0) {
        container.innerHTML = '<div class="empty-state">No favorite recipes found.</div>';
        return;
    }

    container.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" data-recipe-id="${recipe._id || recipe.id}">
            <img src="${recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 alt="${recipe.title}" 
                 class="recipe-image">
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <div class="recipe-meta">
                    <span>${recipe.difficulty || 'Medium'} • ${recipe.cookingTime || 30} mins</span>
                </div>
                <p class="recipe-description">${recipe.description || ''}</p>
            </div>
        </div>
    `).join('');

    // Add click handlers to recipe cards
    container.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', () => {
            const recipeId = card.dataset.recipeId;
            window.location.href = `recipes.html?id=${recipeId}`;
        });
    });
}

// View meal plan details
function viewMealPlan(planId) {
    window.location.href = `meal-plan.html?id=${planId}`;
}


// Add this function to handle recipe deletion
async function deleteRecipe(recipeId) {
    try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            loadUserRecipes(); // Refresh the list
        } else {
            console.error('Failed to delete recipe');
        }
    } catch (error) {
        console.error('Error deleting recipe:', error);
    }
}


function displayMealDBRecipes(recipes, container) {
    container.innerHTML = '';
    
    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        card.innerHTML = `
            <div class="recipe-card-image">
                <img src="${recipe.strMealThumb || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${recipe.strMeal}" 
                     class="recipe-image">
            </div>
            <div class="recipe-card-content">
                <h3 class="recipe-card-title">${recipe.strMeal}</h3>
                <div class="recipe-card-meta">
                    <span>${recipe.strCategory || 'Unknown'}</span>
                    <span>${recipe.strArea || 'Unknown'}</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `recipes.html?id=${recipe.idMeal}`;
        });
        
        container.appendChild(card);
    });
}

