document.addEventListener('DOMContentLoaded', function() {
    const mealPlanForm = document.getElementById('meal-plan-form');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const urlParams = new URLSearchParams(window.location.search);
    const mealPlanId = urlParams.get('id');

    // Check if user is logged in
    if (!localStorage.getItem('userId')) {
        alert('Please log in to create a meal plan');
        window.location.href = 'signin.html?redirect=meal-planner.html';
        return;
    }

    // Load meal plan data if editing
    if (mealPlanId) {
        loadMealPlanData(mealPlanId);
    }

    // Add ingredient button functionality
    days.forEach(day => {
        const addButton = document.querySelector(`[data-day="${day}"]`);
        const ingredientsList = document.getElementById(`${day}-ingredients-list`);

        addButton.addEventListener('click', () => {
            const newIngredient = document.createElement('div');
            newIngredient.className = 'ingredient-input';
            newIngredient.innerHTML = `
                <input type="text" name="${day}[ingredients][]" placeholder="Enter ingredient" required>
                <button type="button" class="remove-ingredient">Remove</button>
            `;
            ingredientsList.appendChild(newIngredient);

            // Add remove functionality to the new ingredient
            const removeButton = newIngredient.querySelector('.remove-ingredient');
            removeButton.addEventListener('click', () => {
                newIngredient.remove();
            });
        });
    });

    // Add remove functionality to initial ingredients
    document.querySelectorAll('.remove-ingredient').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.ingredient-input').remove();
        });
    });

    // Form submission
    mealPlanForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(mealPlanForm);
        const mealPlanData = {
            planName: formData.get('planName'),
            description: formData.get('description'),
            userId: localStorage.getItem('userId'),
            days: {}
        };

        // Collect data for each day
        days.forEach(day => {
            const ingredients = Array.from(formData.getAll(`${day}[ingredients][]`));
            mealPlanData.days[day] = {
                meal: formData.get(`${day}[meal]`),
                ingredients: ingredients,
                instructions: formData.get(`${day}[instructions]`)
            };
        });

        try {
            const endpoint = mealPlanId ? `/api/meal-plans/${mealPlanId}` : '/api/meal-plans';
            const method = mealPlanId ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(mealPlanData)
            });

            if (!response.ok) {
                throw new Error('Failed to save meal plan');
            }

            const result = await response.json();
            alert('Meal plan saved successfully!');
            window.location.href = '/profile.html';
        } catch (error) {
            console.error('Error saving meal plan:', error);
            alert('Failed to save meal plan. Please try again.');
        }
    });

    async function loadMealPlanData(id) {
        try {
            const response = await fetch(`/api/meal-plans/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load meal plan');
            
            const result = await response.json();
            
            // Extract the mealPlan object from the response
            const mealPlan = result.mealPlan;
            
            if (!mealPlan) {
                throw new Error('Invalid meal plan data structure');
            }
            
            // Ensure days object exists and has proper structure
            if (!mealPlan.days) {
                mealPlan.days = {
                    monday: { meal: '', ingredients: [], instructions: '' },
                    tuesday: { meal: '', ingredients: [], instructions: '' },
                    wednesday: { meal: '', ingredients: [], instructions: '' },
                    thursday: { meal: '', ingredients: [], instructions: '' },
                    friday: { meal: '', ingredients: [], instructions: '' }
                };
            }
            
            populateForm(mealPlan);
        } catch (error) {
            console.error('Error loading meal plan:', error);
            alert('Failed to load meal plan. Please try again.');
        }
    }

    function populateForm(mealPlan) {
        document.getElementById('plan-name').value = mealPlan.planName || '';
        document.getElementById('plan-description').value = mealPlan.description || '';
        
        days.forEach(day => {
            // Ensure day data exists
            const dayData = mealPlan.days[day] || { 
                meal: '', 
                ingredients: [], 
                instructions: '' 
            };
            
            document.getElementById(`${day}-meal`).value = dayData.meal || '';
            document.getElementById(`${day}-instructions`).value = dayData.instructions || '';
            
            const ingredientsList = document.getElementById(`${day}-ingredients-list`);
            ingredientsList.innerHTML = '';
            
            if (dayData.ingredients && dayData.ingredients.length > 0) {
                dayData.ingredients.forEach(ingredient => {
                    const newIngredient = document.createElement('div');
                    newIngredient.className = 'ingredient-input';
                    newIngredient.innerHTML = `
                        <input type="text" name="${day}[ingredients][]" value="${ingredient}" placeholder="Enter ingredient" required>
                        <button type="button" class="remove-ingredient">Remove</button>
                    `;
                    ingredientsList.appendChild(newIngredient);
                    
                    // Add remove functionality
                    newIngredient.querySelector('.remove-ingredient').addEventListener('click', () => {
                        newIngredient.remove();
                    });
                });
            }
        });
    }
});