const registerForm = document.getElementById('register-form');
const messageElement = document.getElementById('message');

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const userId = document.getElementById('user_id').value;
    try {
        const response = await fetch('/api/login', { // Используем тот же эндпоинт
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, user_id: userId }),
        });
        const result = await response.json();
        if (result.status === 'success') {
            sessionStorage.setItem('userData', JSON.stringify(result.userData));
            window.location.href = result.redirectUrl;
        } else {
            messageElement.style.color = 'red';
            messageElement.textContent = result.message;
        }
    } catch (error) {
        messageElement.style.color = 'red';
        messageElement.textContent = 'An error occurred. Please try again.';
    }
});