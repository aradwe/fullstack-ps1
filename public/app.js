const helloBtn = document.getElementById('hello-btn');
const userForm = document.getElementById('user-form');
const output = document.getElementById('output');

helloBtn.addEventListener('click', async () => {
  output.textContent = 'Loading...';

  try {
    const response = await fetch('/api/hello');
    const data = await response.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = 'Request failed: ' + err.message;
  }
});

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  output.textContent = 'Creating user...';

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await response.json();
    output.textContent = `${response.status} ${response.statusText}\n\n${JSON.stringify(data, null, 2)}`;
  } catch (err) {
    output.textContent = 'Request failed: ' + err.message;
  }
});
