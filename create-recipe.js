document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!localStorage.getItem('authToken')) {
        window.location.href = 'signin.html';
        return;
    }

    initializeForm();
});

function initializeForm() {
    const form = document.getElementById('recipe-form');
    const addIngredientBtn = document.getElementById('add-ingredient');
    const addInstructionBtn = document.getElementById('add-instruction');

    // Set up event listeners
    form.addEventListener('submit', handleSubmit);
    addIngredientBtn.addEventListener('click', addIngredientRow);
    addInstructionBtn.addEventListener('click', addInstructionRow);

    // Set up initial remove buttons
    setupRemoveButtons();
}

function addIngredientRow() {
    const container = document.getElementById('ingredients-list');
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.innerHTML = `
        <input type="text" name="ingredients[]" placeholder="Enter ingredient" required>
        <input type="text" name="amounts[]" placeholder="Amount">
        <input type="text" name="units[]" placeholder="Unit">
        <button type="button" class="remove-btn" title="Remove ingredient">×</button>
    `;
    container.appendChild(row);
    setupRemoveButtons();
}

function addInstructionRow() {
    const container = document.getElementById('instructions-list');
    const row = document.createElement('div');
    row.className = 'instruction-row';
    row.innerHTML = `
        <span class="step-number">${container.children.length + 1}</span>
        <textarea name="instructions[]" rows="2" placeholder="Enter instruction step" required></textarea>
        <button type="button" class="remove-btn" title="Remove step">×</button>
    `;
    container.appendChild(row);
    setupRemoveButtons();
}

function setupRemoveButtons() {
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const row = button.closest('.ingredient-row, .instruction-row');
            const container = row.parentElement;
            container.removeChild(row);
            
            // Update step numbers if it's an instruction
            if (container.id === 'instructions-list') {
                updateStepNumbers();
            }
        });
    });
}

function updateStepNumbers() {
    const steps = document.querySelectorAll('#instructions-list .step-number');
    steps.forEach((step, index) => {
        step.textContent = index + 1;
    });
}

async function handleSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const recipe = {
            title: formData.get('title'),
            description: formData.get('description'),
            cookingTime: parseInt(formData.get('cookTime')), // Match server's expected field name
            servings: parseInt(formData.get('servings')),
            isPublic: formData.get('visibility') === 'public',
            ingredients: [],
            instructions: [],
            userId: localStorage.getItem('userId'),
            difficulty: 'medium', // Add required server fields
            cuisine: 'other'
        };

        // Collect ingredients
        const ingredients = formData.getAll('ingredients[]');
        const amounts = formData.getAll('amounts[]');
        const units = formData.getAll('units[]');
        
        ingredients.forEach((ingredient, index) => {
            if (ingredient.trim()) {
                recipe.ingredients.push({
                    name: ingredient.trim(),
                    amount: amounts[index].trim(),
                    unit: units[index].trim()
                });
            }
        });

        // Collect instructions
        const instructions = formData.getAll('instructions[]');
        instructions.forEach((instruction, index) => {
            if (instruction.trim()) {
                recipe.instructions.push({
                    step: index + 1,
                    text: instruction.trim()
                });
            }
        });

        // Validate recipe
        if (!validateRecipe(recipe)) {
            return;
        }

        // Send to server
        const response = await fetch('/api/recipes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(recipe)
        });

        if (!response.ok) {
            throw new Error('Failed to create recipe');
        }

        // Get the created recipe ID from response
        const createdRecipe = await response.json();
        const recipeId = createdRecipe._id;

        // Show success popup with recipe ID in a more prominent format
        showSuccess(`Recipe created successfully!\nRecipe ID: ${recipeId}\n\nRedirecting to profile page...`);

        // Update user profile and redirect
        await updateUserProfileWithRecipe(recipeId);

        // Redirect to profile page after a short delay
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2000);

    } catch (error) {
        console.error('Error creating recipe:', error);
        showError('Failed to create recipe. Please try again.');
    }
}

function validateRecipe(recipe) {
    if (!recipe.title || !recipe.title.trim()) {
        showError('Please enter a recipe title');
        return false;
    }

    if (!recipe.description || !recipe.description.trim()) {
        showError('Please enter a recipe description');
        return false;
    }

    if (!recipe.cookingTime || recipe.cookingTime <= 0) {
        showError('Please enter a valid cooking time');
        return false;
    }

    if (!recipe.servings || recipe.servings <= 0) {
        showError('Please enter a valid number of servings');
        return false;
    }

    if (recipe.ingredients.length === 0) {
        showError('Please add at least one ingredient');
        return false;
    }

    if (recipe.instructions.length === 0) {
        showError('Please add at least one instruction step');
        return false;
    }

    if (!recipe.userId) {
        showError('User authentication required');
        window.location.href = 'signin.html';
        return false;
    }

    return true;
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show and then hide after delay
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 10);
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

async function updateUserProfileWithRecipe(recipeId) {
    try {
        const userId = localStorage.getItem('userId');
        const updateResponse = await fetch('/api/users/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                recipeId
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update user profile');
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        showError('Failed to update user profile with recipe');
    }
}