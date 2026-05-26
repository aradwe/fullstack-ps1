const button = document.getElementById('hello-btn');
const output = document.getElementById('output');

button.addEventListener('click', async () => {
  output.textContent = 'Loading...';

  try {
    const response = await fetch('/api/hello');
    const data = await response.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = 'Request failed: ' + err.message;
  }
});
