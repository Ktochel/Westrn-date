const loginForm = document.getElementById('login-form');
const messageElement = document.getElementById('message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const userId = document.getElementById('user_id').value;

    if (!/^\d+$/.test(userId)) {
        messageElement.style.color = 'red';
        messageElement.textContent = 'User ID must contain only numbers.';
        return;
    }

    try {
        const response = await fetch('/api/login', {
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
        console.error('Error:', error);
        messageElement.style.color = 'red';
        messageElement.textContent = 'An error occurred. Please try again.';
    }
});