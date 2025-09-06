// MultipleFiles/auth.js
// Centralized Authentication Manager

class AuthManager {
    static init() {
        // Check for session expiration on page load
        AuthManager.checkSession();
        // Set up activity listener to extend session
        document.addEventListener('mousemove', AuthManager.resetActivityTimer);
        document.addEventListener('keypress', AuthManager.resetActivityTimer);
        document.addEventListener('click', AuthManager.resetActivityTimer);
    }

    static checkSession() {
        const sessionStart = localStorage.getItem('sessionStart');
        const lastActivity = localStorage.getItem('lastActivity');
        const currentUser = localStorage.getItem('mr_appointment_current_user');

        if (sessionStart && lastActivity && currentUser) {
            const sessionDuration = 30 * 60 * 1000; // 30 minutes
            const inactivityTimeout = 5 * 60 * 1000; // 5 minutes

            const now = Date.now();
            if (now - parseInt(sessionStart, 10) > sessionDuration || now - parseInt(lastActivity, 10) > inactivityTimeout) {
                AuthManager.logout('Your session has expired due to inactivity or prolonged use. Please log in again.');
                return false;
            }
            // Update last activity if session is still valid
            localStorage.setItem('lastActivity', now.toString());
            return true;
        }
        return false;
    }

    static resetActivityTimer() {
        if (AuthManager.isLoggedIn()) {
            localStorage.setItem('lastActivity', Date.now().toString());
        }
    }

    static isLoggedIn() {
        return AuthManager.checkSession() && localStorage.getItem('mr_appointment_current_user') !== null;
    }

    static getCurrentUser() {
        const user = localStorage.getItem('mr_appointment_current_user');
        return user ? JSON.parse(user) : null;
    }

    static getUserRole() {
        const user = AuthManager.getCurrentUser();
        return user ? user.role : null;
    }

    static checkAuthAndRedirect(requiredRole = null) {
        if (!AuthManager.isLoggedIn()) {
            sessionStorage.setItem('authMessage', 'Please log in to access this page.');
            window.location.href = 'signin.html';
            return false;
        }

        const userRole = AuthManager.getUserRole();
        if (requiredRole && userRole !== requiredRole) {
            sessionStorage.setItem('authMessage', `Access denied. You must be a ${requiredRole} to view this page.`);
            AuthManager.logout(); // Log out if role is incorrect
            return false;
        }
        return true;
    }

    static redirectByRole(role) {
        if (role === "patient") window.location.href = "patient.html";
        else if (role === "doctor") window.location.href = "doctor.html";
        else if (role === "admin") window.location.href = "admin.html";
        else window.location.href = "index.html";
    }

    static login(email, password, rememberMe = false) {
        const users = JSON.parse(localStorage.getItem("mr_appointment_users") || "[]");
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem("mr_appointment_current_user", JSON.stringify(user));
            localStorage.setItem("sessionStart", Date.now().toString());
            localStorage.setItem("lastActivity", Date.now().toString());
            AuthManager.showCustomAlert("Login successful! Redirecting...", 'success');
            setTimeout(() => AuthManager.redirectByRole(user.role), 1000);
            return true;
        } else {
            AuthManager.showCustomAlert("Invalid email or password. Please try again.", 'error');
            return false;
        }
    }

    static signup(userData) {
        const existingUsers = JSON.parse(localStorage.getItem("mr_appointment_users") || "[]");
        if (existingUsers.some(user => user.email === userData.email)) {
            AuthManager.showCustomAlert("This email is already registered. Please use a different email or sign in.", 'error');
            return false;
        }

        existingUsers.push(userData);
        localStorage.setItem("mr_appointment_users", JSON.stringify(existingUsers));
        AuthManager.showCustomAlert("Account created successfully! Redirecting...", 'success');
        localStorage.setItem("mr_appointment_current_user", JSON.stringify(userData)); // Auto-login after signup
        localStorage.setItem("sessionStart", Date.now().toString());
        localStorage.setItem("lastActivity", Date.now().toString());
        setTimeout(() => AuthManager.redirectByRole(userData.role), 1000);
        return true;
    }

    static logout(message = 'You have been logged out.') {
        localStorage.removeItem("mr_appointment_current_user");
        localStorage.removeItem("sessionStart");
        localStorage.removeItem("lastActivity");
        sessionStorage.setItem('authMessage', message); // Store message for signin page
        window.location.href = "signin.html";
    }

    // Utility to display custom alerts
    static showCustomAlert(message, type = 'info') {
        const container = document.getElementById('customAlertContainer') || document.body; // Fallback to body if no specific container
        
        // Remove any existing alerts to prevent stacking
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert custom-alert-${type}`;
        alertDiv.setAttribute('role', 'alert');

        let iconClass = '';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        else if (type === 'error') iconClass = 'fas fa-exclamation-circle';
        else iconClass = 'fas fa-info-circle';

        alertDiv.innerHTML = `
            <i class="${iconClass} custom-alert-icon"></i>
            <div class="custom-alert-message">${message}</div>
            <button class="custom-alert-close" onclick="this.parentNode.remove()">&times;</button>
        `;

        // Append to a specific container if it exists, otherwise to body
        if (document.getElementById('customAlertContainer')) {
            document.getElementById('customAlertContainer').appendChild(alertDiv);
        } else {
            // If no specific container, append to body and add basic styling for positioning
            Object.assign(alertDiv.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '9999',
                padding: '15px 25px',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'white',
                transform: 'translateX(100%)',
                animation: 'slideIn 0.5s forwards'
            });
            document.body.appendChild(alertDiv);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Initialize sample users on first load
    static initializeSampleUsers() {
        if (!localStorage.getItem("mr_appointment_users")) {
            const sampleUsers = [
                {
                    name: "Rajesh Kumar",
                    email: "patient@example.com",
                    password: "password123",
                    role: "patient"
                },
                {
                    name: "Dr. Priya Sharma",
                    email: "doctor@example.com",
                    password: "password123",
                    role: "doctor",
                    license: "MED123456",
                    specialty: "cardiology",
                    experience: 8,
                    hospital: "apollo",
                    city: "delhi",
                    qualification: "MBBS, MD",
                    bio: "Experienced cardiologist with a focus on preventive care."
                },
                {
                    name: "Admin User",
                    email: "admin@example.com",
                    password: "admin123",
                    role: "admin"
                }
            ];
            localStorage.setItem("mr_appointment_users", JSON.stringify(sampleUsers));
        }
    }
}

// Initialize AuthManager and sample users when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    AuthManager.initializeSampleUsers();
    AuthManager.init(); // Start session management
    
    // Display any auth messages from sessionStorage
    const authMessage = sessionStorage.getItem('authMessage');
    if (authMessage) {
        AuthManager.showCustomAlert(authMessage, 'info');
        sessionStorage.removeItem('authMessage'); // Clear message after displaying
    }
});

// Global helper for custom alerts (for files that don't directly import AuthManager class)
function showCustomAlert(message, type = 'info') {
    AuthManager.showCustomAlert(message, type);
}