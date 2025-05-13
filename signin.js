document.addEventListener('DOMContentLoaded', () => {
    console.log('SignIn page loaded');
    const form = document.getElementById('signin-form');
    if (form) {
        form.addEventListener('submit', handleSignIn);
    } else {
        console.error('Sign-in form not found');
    }
    
    const googleSignInButton = document.querySelector('.google-signin');
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', handleGoogleSignIn);
    }
});

async function handleGoogleSignIn() {
    try {
        // Initialize Google OAuth client
        const client = google.accounts.oauth2.initTokenClient({
            client_id: '444218256661-8skotkmfhlpt89057q0281eq0vu4qlku.apps.googleusercontent.com',
            scope: 'profile email',
            callback: async (response) => {
                if (response.access_token) {
                    // Send token to your backend for verification
                    const res = await fetch('/api/users/google-auth', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            token: response.access_token
                        })
                    });
                    
                    const userData = await res.json();
                    
                    if (res.ok) {
                        // Store user data in localStorage
                        localStorage.setItem('userId', userData._id);
                        localStorage.setItem('userName', userData.name);
                        localStorage.setItem('username', userData.username);
                        localStorage.setItem('authToken', userData.token);
                        
                        // Redirect to profile page
                        window.location.href = 'profile.html';
                    } else {
                        throw new Error(userData.message || 'Google authentication failed');
                    }
                }
            }
        });
        
        // Request access token
        client.requestAccessToken();
    } catch (error) {
        console.error('Google sign-in error:', error);
        showError('Google sign-in failed: ' + error.message);
    }
}

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
    if (userInput === 'admin' && password === 'admin1') {
        console.log('Admin login successful');
        localStorage.setItem('userId', 'admin');
        localStorage.setItem('userName', 'Administrator');
        localStorage.setItem('username', 'admin');
        localStorage.setItem('authToken', 'admin-token');
        localStorage.setItem('adminToken', 'admin-token'); // Add this line
        localStorage.setItem('userRole', 'admin'); // Add this line
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