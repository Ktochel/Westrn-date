const loginForm = document.getElementById('admin-login-form');
const messageElement = document.getElementById('message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (result.success) {
        window.location.href = '/admin'; // Перенаправляем на админ-панель
    } else {
        messageElement.style.color = 'red';
        messageElement.textContent = result.message;
    }
});