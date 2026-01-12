// Authentication functionality for login and signup pages

const API_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', function() {
  // Handle signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword')?.value;
      const role = document.querySelector('input[name="role"]:checked')?.value || 'patient';
      
      // Validate password match
      if (confirmPassword && password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          alert(data.error || 'Registration failed');
          return;
        }
        
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
      }
    });
  }
  
  // Handle login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          alert(data.error || 'Login failed');
          return;
        }
        
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.name);
        
        alert('Login successful!');
        
        // Redirect to appropriate dashboard
        // You can enhance this to redirect based on user role
        window.location.href = 'dashboard-patient.html';
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    });
  }
});
