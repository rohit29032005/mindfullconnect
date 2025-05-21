// Initialize Firebase Authentication and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Signup function
const signupForm = document.getElementById('signupForm');
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const role = document.querySelector('input[name="role"]:checked').value;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Create user with email and password
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Add user details to Firestore
      return db.collection('users').doc(user.uid).set({
        role: role,
        name: name,
        email: email
      });
    })
    .then(() => {
      // Redirect to dashboard or show success message
      window.location.href = 'dashboard-patient.html';
    })
    .catch((error) => {
      console.error('Error signing up:', error);
      alert('Error signing up: ' + error.message);
    });
});