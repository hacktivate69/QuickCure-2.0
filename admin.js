// MultipleFiles/admin.js
document.addEventListener("DOMContentLoaded", () => {
    // Check authentication using AuthManager
    if (typeof AuthManager === 'undefined') {
        showCustomAlert('Authentication system not loaded. Please refresh the page.', 'error');
        window.location.href = 'admin-signin.html'; // Redirect to signin if AuthManager is missing
        return;
    }
    
    // Ensure the user is logged in and is an admin
    if (!AuthManager.checkAuthAndRedirect('admin')) {
        return; // Stop execution if not authenticated or not an admin
    }

    // --- Data Loading from localStorage ---
    // Hospitals are managed by admin-hospital.js and stored under 'quickcare_hospitals'
    const hospitals = JSON.parse(localStorage.getItem('quickcare_hospitals')) || [];
    // Doctors are managed by admin-doctor.js and stored under 'doctors'
    const doctors = JSON.parse(localStorage.getItem('doctors')) || [];

    // For dashboard stats, we derive appointments and users from existing data.
    // In a real system, these would come from their own dedicated management sections.
    const appointments = doctors.flatMap(doc => {
        // Simulate some appointments for each doctor based on their availability
        const apts = [];
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Only create appointments if the doctor is 'available' or 'busy'
        if (doc.availability === 'available' || doc.availability === 'busy') {
            const hospitalName = hospitals.find(h => h.id === doc.hospital)?.name || 'N/A';

            // Add a few sample appointments for today
            for (let i = 0; i < 2; i++) { // Simulate 2 appointments per available/busy doctor
                const aptTime = `${9 + i * 2}:00 AM`; // 9:00 AM, 11:00 AM
                apts.push({
                    time: aptTime,
                    patient: `Patient ${doc.name.split(' ')[1]}${i + 1}`,
                    doctor: doc.name,
                    hospital: hospitalName,
                    fee: `₹${doc.fee || 500}`,
                    date: today.toISOString().split('T')[0]
                });
            }
        }
        return apts;
    }).filter(apt => apt.date === new Date().toISOString().split('T')[0]); // Only show today's appointments for the stat

    // Simulate users based on doctors, hospitals, and patient users from AuthManager
    const allUsers = JSON.parse(localStorage.getItem("mr_appointment_users") || "[]");
    const totalUsersCount = allUsers.length;


    function formatStatus(status, type = 'default') {
        const statusClasses = {
            'Available': 'status-available',
            'Busy': 'status-busy',
            'On Leave': 'status-on-leave',
            'true': 'status-verified',
            'false': 'status-pending',
            'available': 'status-available', // Added for consistency with doctor availability
            'busy': 'status-busy',
            'on_leave': 'status-on-leave'
        };
        
        const statusText = {
            'true': 'Verified ✓',
            'false': 'Pending ⏳',
            'available': 'Available',
            'busy': 'Busy',
            'on_leave': 'On Leave'
        };
        
        const className = statusClasses[status] || 'status-default';
        const displayText = statusText[status] || status;
        
        return `<span class="${className}">${displayText}</span>`;
    }

    function fillTable(tbodyId, data, type) { // Added 'type' parameter to handle different data structures
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        const table = tbody.closest('table');
        const thead = table.querySelector('thead tr');

        // Clear existing body
        tbody.innerHTML = "";

        if (data.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            const colSpan = thead.querySelectorAll('th').length;
            td.setAttribute("colspan", colSpan);
            td.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #718096;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <div>No data available</div>
                </div>
            `;
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        // Fill rows with enhanced formatting
        data.forEach(rowData => {
            const tr = document.createElement("tr");
            if (type === 'hospital') {
                tr.innerHTML = `
                    <td>${rowData.name}</td>
                    <td>${rowData.type}</td>
                    <td>${rowData.city}</td>
                    <td>${formatStatus(rowData.verified.toString())}</td>
                `;
            } else if (type === 'doctor') {
                tr.innerHTML = `
                    <td>${rowData.name}</td>
                    <td>${rowData.specialty}</td>
                    <td>${hospitals.find(h => h.id === rowData.hospital)?.name || 'N/A'}</td>
                    <td>₹${rowData.fee || 'N/A'}</td>
                    <td>${formatStatus(rowData.availability)}</td>
                `;
            } else if (type === 'appointment') {
                tr.innerHTML = `
                    <td>${rowData.time}</td>
                    <td>${rowData.patient}</td>
                    <td>${rowData.doctor}</td>
                    <td>${rowData.hospital}</td>
                    <td>${rowData.fee}</td>
                `;
            }
            tbody.appendChild(tr);
        });
    }

    // Enhanced counter animation
    function animateCounter(elementId, finalValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let currentValue = 0;
        const increment = finalValue / 30;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                element.textContent = finalValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue);
            }
        }, 50);
    }

    // Add loading animation
    document.body.classList.add('loading');
    
    setTimeout(() => {
        // Populate data tables from localStorage
        fillTable("hospitalTable", hospitals.slice(0, 5), 'hospital'); // Show top 5 recent hospitals
        fillTable("doctorTable", doctors.slice(0, 5), 'doctor');     // Show top 5 recent doctors
        fillTable("appointmentTable", appointments.slice(0, 5), 'appointment'); // Show top 5 recent appointments

        // Animate counters
        animateCounter("hospitalCount", hospitals.length);
        animateCounter("doctorCount", doctors.length);
        animateCounter("appointmentsToday", appointments.length);
        animateCounter("totalUsers", totalUsersCount); // Use the derived users count
        
        // Remove loading animation
        document.body.classList.remove('loading');
    }, 1000);

    // Logout button event listener
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            AuthManager.logout();
        });
    }
});