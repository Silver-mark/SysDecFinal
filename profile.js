document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('authToken')) {
        window.location.href = 'signin.html';
        return;
    }

    loadUserProfile();
    initializeTabs();
    loadInitialTab();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            activateTab(tab, tabName);
        });
    });

    // Initialize tab content loaders
    document.getElementById('favorites-tab').addEventListener('click', () => loadFavorites());
    document.getElementById('mealplans-tab').addEventListener('click', () => loadMealPlans());
    document.getElementById('collections-tab').addEventListener('click', () => loadCollections());
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page loaded');
    
    // Check if user is logged in
    if (!localStorage.getItem('userId')) {
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
});

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

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            activateTab(tab, tabName);
        });
    });
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

// Display user profile data in the UI
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
    
    // User preferences if available
    if (userData.preferences) {
        const preferencesContainer = document.querySelector('.preferences-grid');
        if (preferencesContainer) {
            let preferencesHTML = '';
            
            if (userData.preferences.cuisines && userData.preferences.cuisines.length > 0) {
                preferencesHTML += `
                    <div class="preference-item">
                        <span class="preference-label">Favorite Cuisines</span>
                        <span class="preference-value">${userData.preferences.cuisines.join(', ')}</span>
                    </div>
                `;
            }
            
            if (userData.preferences.diet) {
                preferencesHTML += `
                    <div class="preference-item">
                        <span class="preference-label">Dietary Preference</span>
                        <span class="preference-value">${userData.preferences.diet}</span>
                    </div>
                `;
            }
            
            if (userData.preferences.skillLevel) {
                preferencesHTML += `
                    <div class="preference-item">
                        <span class="preference-label">Cooking Skill</span>
                        <span class="preference-value">${userData.preferences.skillLevel}</span>
                    </div>
                `;
            }
            
            preferencesContainer.innerHTML = preferencesHTML;
        }
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
    
    // Prepare data for API
    const userData = {
        userId,
        name,
        bio,
        avatar: profileImage,
        preferences: {}
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
        
        /* If API fails, use mock data
        console.log('Using mock recipe data');
        const mockRecipes = [
            {
                _id: '1',
                title: 'Spaghetti Carbonara',
                description: 'A classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.',
                cookingTime: 30,
                difficulty: 'Medium',
                isPublic: true,
                image: 'https://via.placeholder.com/300x200?text=Carbonara'
            },
            {
                _id: '2',
                title: 'Chicken Curry',
                description: 'Spicy chicken curry with coconut milk and vegetables, perfect with rice.',
                cookingTime: 45,
                difficulty: 'Easy',
                isPublic: true,
                image: 'https://via.placeholder.com/300x200?text=Curry'
            },
            {
                _id: '3',
                title: 'Chocolate Cake',
                description: 'Rich and moist chocolate cake with ganache frosting.',
                cookingTime: 60,
                difficulty: 'Medium',
                isPublic: false,
                image: 'https://via.placeholder.com/300x200?text=Cake'
            }
        ];
        
        displayUserRecipes(mockRecipes);*/
    } catch (error) {
        console.error('Error in loadUserRecipes:', error);
    }
}

function displayUserRecipes(recipes) {
    const recipesContainer = document.getElementById('user-recipes');
    if (!recipesContainer) return;
    
    if (recipes.length === 0) {
        recipesContainer.innerHTML = '<p class="no-recipes">You haven\'t created any recipes yet.</p>';
        return;
    }
    
    let html = '<div class="recipes-grid">';
    
    recipes.forEach(recipe => {
        html += `
            <div class="recipe-card">
                <div class="recipe-image">
                    ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}">` : '<div class="no-image">No Image</div>'}
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-meta">
                        <span>${recipe.cookingTime} mins</span> • 
                        <span>${recipe.difficulty}</span> • 
                        <span>${recipe.isPublic ? 'Public' : 'Private'}</span>
                    </p>
                    <p class="recipe-description">${recipe.description.substring(0, 100)}${recipe.description.length > 100 ? '...' : ''}</p>
                    <div class="recipe-actions">
                        <a href="recipe.html?id=${recipe._id}" class="view-btn">View</a>
                        <a href="edit-recipe.html?id=${recipe._id}" class="edit-btn">Edit</a>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    recipesContainer.innerHTML = html;
}

// Make sure to call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadUserRecipes();
});


