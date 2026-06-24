const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const alertMsg = document.getElementById('alertMsg');

function showAlert(message, type = 'error') {
    alertMsg.textContent = message;
    alertMsg.className = `alert alert-${type}`;
    alertMsg.style.display = 'block';
    setTimeout(() => {
        alertMsg.style.display = 'none';
    }, 5000);
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                if (data.data.role === 'doctor' || data.data.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            } else {
                showAlert(data.message || 'Login gagal');
            }
        } catch (err) {
            showAlert('Terjadi kesalahan jaringan');
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, username, email, password })
            });
            const data = await res.json();

            if (data.success) {
                showAlert('Registrasi berhasil! Silakan login.', 'success');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showAlert(data.message || 'Registrasi gagal');
            }
        } catch (err) {
            showAlert('Terjadi kesalahan jaringan');
        }
    });
}
