document.addEventListener('DOMContentLoaded', () => {
    console.log('SignIn page loaded');
    const form = document.getElementById('signin-form');
    if (form) {
        form.addEventListener('submit', handleSignIn);
    } else {
        console.error('Sign-in form not found');
    }
});

async function handleSignIn(event) {
    event.preventDefault();
    console.log('Sign-in attempt started');
    
    const userInput = document.getElementById('user-input').value;
    const password = document.getElementById('password').value;
    
    if (!userInput || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Check for admin login
    if (userInput === 'admin' && password === 'admin') {
        console.log('Admin login successful');
        localStorage.setItem('userId', 'admin');
        localStorage.setItem('userName', 'Administrator');
        localStorage.setItem('username', 'admin');
        localStorage.setItem('authToken', 'admin-token');
        localStorage.setItem('isAdmin', 'true');
        window.location.href = 'admin.html';
        return;
    }
    
    try {
        console.log('Sending login request...');
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Send as either email or username based on format
                [userInput.includes('@') ? 'email' : 'username']: userInput,
                password
            })
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        const userData = await response.json();
        console.log('Login successful, user data received');
        
        // Store user data in localStorage
        localStorage.setItem('userId', userData._id);
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('username', userData.username); // Add this line
        localStorage.setItem('authToken', userData.token || 'dummy-token');
        
        console.log('Redirecting to profile page...');
        // Redirect to profile page
        window.location.href = 'profile.html';
    } catch (error) {
        console.error('Login error:', error);
        showError('Invalid username/email or password');
    }
}

function showError(message) {
    // Simple error display
    console.error('Error:', message);
    alert(message);
}