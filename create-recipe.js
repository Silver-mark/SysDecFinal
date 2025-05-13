document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!localStorage.getItem('authToken')) {
        window.location.href = 'signin.html';
        return;
    }

    initializeForm();
});

async function initializeForm() {
    const form = document.getElementById('recipe-form');
    const addIngredientBtn = document.getElementById('add-ingredient');
    const addInstructionBtn = document.getElementById('add-instruction');

    // Check if we're editing an existing recipe
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('edit');
    
    if (recipeId) {
        // Load existing recipe data
        try {
            const response = await fetch(`/api/recipes/${recipeId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const recipe = await response.json();
                populateFormWithRecipeData(recipe);
                document.querySelector('.create-recipe-title').textContent = 'Edit Recipe';
            }
        } catch (error) {
            console.error('Error loading recipe:', error);
        }
    }

    // Set up event listeners
    form.addEventListener('submit', handleSubmit);
    addIngredientBtn.addEventListener('click', addIngredientRow);
    addInstructionBtn.addEventListener('click', addInstructionRow);

    // Set up initial remove buttons
    setupRemoveButtons();
}

function populateFormWithRecipeData(recipe) {
    // Set basic fields
    document.getElementById('title').value = recipe.title;
    document.getElementById('description').value = recipe.description;
    document.getElementById('cookTime').value = recipe.cookingTime;
    document.getElementById('servings').value = recipe.servings;
    
    // Set visibility
    const publicRadio = document.querySelector('input[name="visibility"][value="public"]');
    const privateRadio = document.querySelector('input[name="visibility"][value="private"]');
    if (recipe.isPublic) {
        publicRadio.checked = true;
    } else {
        privateRadio.checked = true;
    }

    // Clear existing ingredients and instructions
    document.getElementById('ingredients-list').innerHTML = '';
    document.getElementById('instructions-list').innerHTML = '';

    // Add ingredients
    recipe.ingredients.forEach(ingredient => {
        addIngredientRow();
        const rows = document.querySelectorAll('.ingredient-row');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('input[name="ingredients[]"]').value = ingredient.name;
        lastRow.querySelector('input[name="amounts[]"]').value = ingredient.amount;
        lastRow.querySelector('input[name="units[]"]').value = ingredient.unit;
    });

    // Add instructions
    recipe.instructions.forEach(instruction => {
        addInstructionRow();
        const rows = document.querySelectorAll('.instruction-row');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('textarea[name="instructions[]"]').value = instruction.text;
    });
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
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('edit');
        
        const recipe = {
            title: formData.get('title'),
            description: formData.get('description'),
            cookingTime: parseInt(formData.get('cookTime')),
            servings: parseInt(formData.get('servings')),
            isPublic: formData.get('visibility') === 'public',
            ingredients: [],
            instructions: [],
            userId: localStorage.getItem('userId'),
            difficulty: 'medium',
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

        // Determine if we're creating or updating
        const url = recipeId ? `/api/recipes/${recipeId}` : '/api/recipes';
        const method = recipeId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(recipe)
        });

        if (!response.ok) {
            throw new Error(recipeId ? 'Failed to update recipe' : 'Failed to create recipe');
        }

        const result = await response.json();
        showSuccess(recipeId ? 'Recipe updated successfully!' : 'Recipe created successfully!');
        
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
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