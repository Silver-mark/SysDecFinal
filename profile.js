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
    loadInitialTab();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    if (!tabs || tabs.length === 0) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            if (tabName) activateTab(tab, tabName);
        });
    });

    // Initialize tab content loaders with null checks
    const favoritesTab = document.getElementById('favorites-tab');
    const mealplansTab = document.getElementById('mealplans-tab');
    const collectionsTab = document.getElementById('collections-tab');
    
    if (favoritesTab) favoritesTab.addEventListener('click', () => loadFavorites());
    if (mealplansTab) mealplansTab.addEventListener('click', () => loadMealPlans());
    if (collectionsTab) collectionsTab.addEventListener('click', () => loadCollections());
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

// Modify the displayUserProfile function to remove preferences section
function displayUserProfile(userData) {
    // Basic profile info
    document.querySelector('.profile-name').textContent = userData.name || 'User';
    document.querySelector('.profile-bio').textContent = userData.bio || 'No bio provided. Click edit to add one.';
    
    // Profile image
    const profileImage = document.querySelector('.profile-avatar');
    if (profileImage) {
        if (userData.profileImage) {
            profileImage.src = userData.profileImage;
        } else if (userData.avatar) {
            profileImage.src = userData.avatar;
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
                        profileImage: 'https://via.placeholder.com/150'
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
        profileImage = existingImage ? existingImage.src : 'https://via.placeholder.com/150?text=Profile';
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
        
        // Updated API call with proper endpoint and auth token
        const response = await fetch('/api/users/profile', {
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

function loadTabContent(tabName) {
    console.log(`Loading content for tab: ${tabName}`);
    
    if (tabName === 'my-recipes') {
        loadUserRecipes();
    } else if (tabName === 'favorites') {
        loadFavorites();
    } else if (tabName === 'meal-plans') {
        loadMealPlans();
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
                            <a href="recipes.html?id=${recipe._id}" class="view-btn">View</a>
                            <a href="create-recipe.html?edit=${recipe._id}" class="edit-btn">Edit</a>
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
        const authToken = localStorage.getItem('authToken');
        
        if (!userId || !authToken) {
            console.error('Missing user ID or auth token');
            return;
        }

        showLoading('Loading meal plans...');
        // Change this endpoint to match the backend route
        const response = await fetch(`/api/meal-plans/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const mealPlans = await response.json();
        
        if (!Array.isArray(mealPlans)) {
            throw new Error('Invalid meal plans data format');
        }

        // Format the meal plans data as expected
        const formattedPlans = mealPlans.map(plan => ({
            _id: plan._id,
            planName: plan.planName,
            description: plan.description,
            days: {
                monday: { meal: plan.days?.monday?.meal || '' },
                tuesday: { meal: plan.days?.tuesday?.meal || '' },
                wednesday: { meal: plan.days?.wednesday?.meal || '' },
                thursday: { meal: plan.days?.thursday?.meal || '' },
                friday: { meal: plan.days?.friday?.meal || '' },
                saturday: { meal: plan.days?.saturday?.meal || '' },
                sunday: { meal: plan.days?.sunday?.meal || '' }
            }
        }));

        displayMealPlans(formattedPlans);
        hideLoading();
    } catch (error) {
        console.error('Error loading meal plans:', error);
        hideLoading();
        showError('Failed to load meal plans. Please try again later.');
        
        const container = document.getElementById('meal-plans-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <p>Error loading meal plans</p>
                    <button class="retry-btn" onclick="loadMealPlans()">Retry</button>
                </div>
            `;
        }
    }
}

function displayMealPlans(mealPlans) {
    const container = document.getElementById('meal-plans-grid');
    if (!mealPlans || mealPlans.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>You haven't created any meal plans yet.</p>
                <button id="create-first-mealplan" class="btn primary-btn">
                    Create Your First Meal Plan
                </button>
            </div>
        `;
        document.getElementById('create-first-mealplan').addEventListener('click', () => {
            window.location.href = 'meal-planner.html';
        });
        return;
    }

    container.innerHTML = `
        <div class="section-header">
            <h2>Your Meal Plans</h2>
            <button id="create-mealplan-btn" class="btn primary-btn">
                Create New Meal Plan
            </button>
        </div>
        <div class="mealplans-grid">
            ${mealPlans.map(plan => `
                <div class="mealplan-card" data-id="${plan._id}">
                    <h3>${plan.planName}</h3>
                    <p class="mealplan-description">${plan.description || 'No description'}</p>
                    <div class="mealplan-days">
                        ${Object.entries(plan.days).map(([day, details]) => `
                            <div class="mealplan-day">
                                <strong>${day.charAt(0).toUpperCase() + day.slice(1)}:</strong>
                                ${details.meal || 'No meal planned'}
                            </div>
                        `).join('')}
                    </div>
                    <div class="mealplan-actions">
                        <button class="btn view-btn" onclick="window.location.href='meal-planner.html?id=${plan._id}'">
                            View
                        </button>
                        <button class="btn edit-btn" onclick="editMealPlan('${plan._id}')">
                            Edit
                        </button>
                        <button class="btn delete-btn" onclick="deleteMealPlan('${plan._id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
// Load user favorites
async function loadFavorites() {
    try {
        const userId = localStorage.getItem('userId');
        const authToken = localStorage.getItem('authToken');
        
        if (!userId || !authToken) {
            return;
        }
        
        const favoritesContainer = document.getElementById('favorites');
        if (!favoritesContainer) return;
        
        favoritesContainer.innerHTML = '<div class="loading">Loading favorites...</div>';
        
        const response = await fetch(`/api/users/${userId}/favorites`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch favorites');
        }
        
        const data = await response.json();
        
        if (!data.favorites || data.favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="empty-state">
                    <p>You haven't added any favorites yet.</p>
                    <a href="recipes-list.html" class="btn primary-btn">Browse Recipes</a>
                </div>
            `;
            return;
        }
        
        // Display favorites
        let html = `
            <div class="section-header">
                <h2>Your Favorite Recipes</h2>
            </div>
            <div class="recipes-grid">
        `;
        
        data.favorites.forEach(recipe => {
            html += `
                <div class="recipe-card">
                    <img src="${recipe.image || 'https://via.placeholder.com/300x200?text=Recipe'}" alt="${recipe.title}" class="recipe-image">
                    <div class="recipe-content">
                        <h3 class="recipe-title">${recipe.title}</h3>
                        <p class="recipe-description">${recipe.description || 'No description provided.'}</p>
                        <div class="recipe-meta">
                            <span class="recipe-time">${recipe.cookingTime || 0} mins</span>
                            <span class="recipe-difficulty">${recipe.difficulty || 'Easy'}</span>
                        </div>
                        <div class="recipe-actions">
                            <button class="btn view-btn" onclick="window.location.href='recipe.html?id=${recipe._id}'">View</button>
                            <button class="btn remove-btn" onclick="removeFromFavorites('${recipe._id}')">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        favoritesContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading favorites:', error);
        const favoritesContainer = document.getElementById('favorites');
        if (favoritesContainer) {
            favoritesContainer.innerHTML = `
                <div class="error-message">
                    <p>Failed to load favorites. Please try again later.</p>
                </div>
            `;
        }
    }
}

// Load user collections
async function loadCollections() {
    try {
        const userId = localStorage.getItem('userId');
        const authToken = localStorage.getItem('authToken');
        
        if (!userId || !authToken) {
            return;
        }
        
        const collectionsContainer = document.getElementById('collections');
        if (!collectionsContainer) return;
        
        collectionsContainer.innerHTML = '<div class="loading">Loading collections...</div>';
        
        const response = await fetch(`/api/users/${userId}/collections`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch collections');
        }
        
        const data = await response.json();
        
        if (!data.collections || data.collections.length === 0) {
            collectionsContainer.innerHTML = `
                <div class="empty-state">
                    <p>You haven't created any collections yet.</p>
                    <button id="create-collection-btn" class="btn primary-btn">Create Collection</button>
                </div>
            `;
            
            const createButton = document.getElementById('create-collection-btn');
            if (createButton) {
                createButton.addEventListener('click', () => {
                    // Open create collection modal or redirect to collection creation page
                    alert('Collection creation feature coming soon!');
                });
            }
            return;
        }
        
        // Display collections
        let html = `
            <div class="section-header">
                <h2>Your Collections</h2>
                <button id="create-collection-btn" class="btn primary-btn">Create Collection</button>
            </div>
            <div class="collections-grid">
        `;
        
        data.collections.forEach(collection => {
            html += `
                <div class="collection-card">
                    <h3 class="collection-title">${collection.name}</h3>
                    <p class="collection-description">${collection.description || 'No description provided.'}</p>
                    <div class="collection-meta">
                        <span>${collection.recipes.length} recipes</span>
                    </div>
                    <div class="collection-actions">
                        <button class="btn view-btn" onclick="viewCollection('${collection._id}')">View</button>
                        <button class="btn edit-btn" onclick="editCollection('${collection._id}')">Edit</button>
                        <button class="btn delete-btn" onclick="deleteCollection('${collection._id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        collectionsContainer.innerHTML = html;
        
        // Set up create collection button
        const createButton = document.getElementById('create-collection-btn');
        if (createButton) {
            createButton.addEventListener('click', () => {
                // Open create collection modal or redirect to collection creation page
                alert('Collection creation feature coming soon!');
            });
        }
        
    } catch (error) {
        console.error('Error loading collections:', error);
        const collectionsContainer = document.getElementById('collections');
        if (collectionsContainer) {
            collectionsContainer.innerHTML = `
                <div class="error-message">
                    <p>Failed to load collections. Please try again later.</p>
                </div>
            `;
        }
    }
}

// View meal plan details
function viewMealPlan(planId) {
    window.location.href = `meal-plan.html?id=${planId}`;
}

// Delete meal plan
async function deleteMealPlan(planId) {
    if (!confirm('Are you sure you want to delete this meal plan?')) {
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`/api/meal-plans/${planId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete meal plan');
        }
        
        // Reload meal plans after deletion
        loadMealPlans();
        showSuccess('Meal plan deleted successfully');
    } catch (error) {
        console.error('Error deleting meal plan:', error);
        showError('Failed to delete meal plan');
    }
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
            <button class="edit-meal-plan-btn" data-id="${plan._id}">Edit</button>
        </div>
    `).join('');
}


