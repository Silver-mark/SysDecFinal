document.addEventListener('DOMContentLoaded', function() {
    const mealPlanForm = document.getElementById('meal-plan-form');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    // Check if user is logged in
    if (!localStorage.getItem('userId')) {
        alert('Please log in to create a meal plan');
        window.location.href = 'signin.html?redirect=meal-planner.html';
        return;
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
            const response = await fetch('/api/meal-plans', {
                method: 'POST',
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
});