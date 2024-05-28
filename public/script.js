// Handle form submission
document.getElementById('tokenForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const token = document.getElementById('pageAccessToken').value;
  if (token) {
    fetch('/setToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: token })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'This token is already saved.') {
        alert('This token is already saved.');
      } else {
        alert('Submitted successfully!');
      }
      document.getElementById('pageAccessToken').value = ''; // Clear input field after submission
    })
    .catch(error => {
      console.error('Error:', error);
      alert('There was an error processing your request.');
    });
  } else {
    alert('Please enter a valid token.');
  }
});

// Fetch and display the number of active bots
fetch('/getActiveBots')
  .then(response => response.json())
  .then(data => {
    document.getElementById('botNumber').innerText = data.botNumber;
  })
  .catch(error => {
    console.error('Error fetching active bots:', error);
  });

// Toggle theme
document.getElementById('themeSwitch').addEventListener('change', function() {
  if (this.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
});