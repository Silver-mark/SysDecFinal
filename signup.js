document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const inputs = document.querySelectorAll('.form-input');
    const submitButton = document.querySelector('button[type="submit"]');
    const passwordToggles = document.querySelectorAll('.password-toggle');
    const termsCheckbox = document.getElementById('terms');

    // Simplified validation patterns
    const patterns = {
        username: /^[a-zA-Z0-9_]{3,}$/,
        email: /.+@.+\..+/,
        password: /.{6,}/, // Simplified password requirement
        'first-name': /.+/,
        'last-name': /.+/
    };

    // Add event listeners to inputs
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
            checkFormValidity();
        });
    });

    // Add event listeners to password toggles if they exist
    if (passwordToggles) {
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const passwordField = toggle.previousElementSibling;
                const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordField.setAttribute('type', type);
                
                const icon = toggle.querySelector('i');
                if (icon) {
                    if (type === 'text') {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        });
    }

    // Add event listener to terms checkbox
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', checkFormValidity);
    }

    // Add event listener to form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Simplified form validation - just check if passwords match
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            
            try {
                // Simple fetch request to register endpoint
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: `${firstName} ${lastName}`,
                        username,
                        email,
                        password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('Registration successful!');
                    window.location.href = 'signin.html';
                } else {
                    alert(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed - please try again');
            }
        });
    }
    
    // Simplified validation function
    function validateInput(input) {
        const field = input.id;
        const value = input.value.trim();
        clearInputError(field);
        
        if (!input.hasAttribute('required') && value === '') {
            return true;
        }
        
        if (input.hasAttribute('required') && value === '') {
            showInputError(field, 'This field is required');
            return false;
        }
        
        // Simple password confirmation check
        if (field === 'confirm-password') {
            const password = document.getElementById('password').value;
            if (value !== password) {
                showInputError(field, 'Passwords do not match');
                return false;
            }
            return true;
        }
        
        // Pattern validation for other fields
        if (patterns[field] && !patterns[field].test(value)) {
            let message = 'Invalid input';
            
            if (field === 'username') {
                message = 'Username must be 3-20 characters and can only contain letters, numbers, and underscores';
            } else if (field === 'email') {
                message = 'Please enter a valid email address';
            } else if (field === 'password') {
                message = 'Password must be at least 6 characters';
            } else if (field === 'first-name' || field === 'last-name') {
                message = 'Name is required';
            }
            
            showInputError(field, message);
            return false;
        }
        
        return true;
    }
    
    // Simplified form validity check
    function checkFormValidity() {
        // Just check if passwords match for simplicity
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            return false;
        }
        
        // Check terms checkbox if it exists
        if (termsCheckbox && !termsCheckbox.checked) {
            return false;
        }
        
        return true;
    }
    
    // Simplified error display functions
    function showInputError(field, message) {
        const input = document.getElementById(field);
        const errorElement = input.nextElementSibling;
        
        if (input && errorElement) {
            input.classList.add('error');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function clearInputError(field) {
        const input = document.getElementById(field);
        const errorElement = input.nextElementSibling;
        
        if (input && errorElement) {
            input.classList.remove('error');
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
});