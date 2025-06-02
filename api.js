const API_URL = 'http://localhost:3001'; // Your backend server port

// User registration function
async function registerUser(userData) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// User login function
async function loginUser(credentials) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store the JWT token in localStorage for future authenticated requests
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.name);
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Export the functions
window.api = {
  registerUser,
  loginUser
};