// static/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Login Page Logic ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorMessageDiv = document.getElementById('login-error-message');
            errorMessageDiv.textContent = ''; // Clear previous errors

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (data.success) {
                    window.location.href = 'landing.html'; // Or a dashboard page
                } else {
                    errorMessageDiv.textContent = data.message || 'Login failed.';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessageDiv.textContent = 'An error occurred during login.';
            }
        });
    }

    // --- Registration Page Logic ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            // Optional: Add password confirmation field and check
            const messageDiv = document.getElementById('register-message');
            messageDiv.textContent = ''; // Clear previous messages

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (data.success) {
                    messageDiv.textContent = 'Registration successful! Redirecting to login...';
                    messageDiv.style.color = 'green';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    messageDiv.textContent = data.message || 'Registration failed.';
                    messageDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Registration error:', error);
                messageDiv.textContent = 'An error occurred during registration.';
                messageDiv.style.color = 'red';
            }
        });
    }
});

// Function to check session (can be called on page load for header updates later)
async function checkSession() {
    try {
        const response = await fetch('/api/session');
        const data = await response.json();
        return data.success ? data.user : null;
    } catch (error) {
        console.error('Error checking session:', error);
        return null;
    }
}

async function updateLoginStatusUI() {
    const user = await checkSession();
    const navLinksContainer = document.getElementById('user-navigation-links');
    const actionButtonsContainer = document.getElementById('user-action-buttons');

    if (!navLinksContainer || !actionButtonsContainer) {
        console.warn('Navigation containers not found in this page. Skipping UI update.');
        return;
    }

    navLinksContainer.innerHTML = ''; // Clear existing links
    actionButtonsContainer.innerHTML = ''; // Clear existing buttons

    if (user) {
        // User is logged in
        navLinksContainer.innerHTML = `
            <a class="text-[#0d141c] text-sm font-medium leading-normal" href="calendar.html">Book Appointment</a>
            <a class="text-[#0d141c] text-sm font-medium leading-normal" href="my_pets.html">My Pets</a> 
            <a class="text-[#0d141c] text-sm font-medium leading-normal" href="my_bookings.html">My Bookings</a>
            <a class="text-[#0d141c] text-sm font-medium leading-normal" href="#">Profile</a>
        `;
        // Note: my_bookings.html needs to be created. Profile link is #.
        actionButtonsContainer.innerHTML = `
            <button id="logout-button" class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e7edf4] text-[#0d141c] text-sm font-bold leading-normal tracking-[0.015em]">
                <span class="truncate">Logout</span>
            </button>
        `;
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', logoutUser);
        }
    } else {
        // User is not logged in
        navLinksContainer.innerHTML = `
            <a class="text-[#0d141c] text-sm font-medium leading-normal" href="landing.html#services">Services</a>
            <a class="text-[#0d141c] text-sm font-medium leading-normal" href="landing.html#pricing">Pricing</a>
            <a class="text-[#0d141c] text-sm font-medium leading-normal" href="landing.html#contact">Contact</a>
        `;
        actionButtonsContainer.innerHTML = `
            <a href="login.html" class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#3d98f4] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em]">
                <span class="truncate">Log In</span>
            </a>
            <a href="register.html" class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e7edf4] text-[#0d141c] text-sm font-bold leading-normal tracking-[0.015em]">
                <span class="truncate">Sign Up</span>
            </a>
        `;
    }
}

async function logoutUser() {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Logout failed.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout.');
    }
}

// Ensure updateLoginStatusUI is called on relevant pages
// This will be handled by adding a script block in each HTML file's body,
// after including auth.js, that calls:
// document.addEventListener('DOMContentLoaded', () => {
//   if (typeof updateLoginStatusUI === 'function') {
//     updateLoginStatusUI();
//   }
// });
