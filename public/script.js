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
      document.getElementById('warning').innerText = data.message;
      alert('Submitted successfully!');
      document.getElementById('pageAccessToken').value = ''; // Clear input field after successful submission
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('warning').innerText = 'There was an error processing your request.';
    });
  } else {
    document.getElementById('warning').innerText = 'Please enter a valid token.';
    alert('Please enter a valid token.');
  }
});

// Fetch and display the number of active bots
fetch('/getTotalBots')
  .then(response => response.json())
  .then(data => {
    document.getElementById('botNumber').innerText = data.botNumber;
  })
  .catch(error => {
    console.error('Error fetching active bots:', error);
  });