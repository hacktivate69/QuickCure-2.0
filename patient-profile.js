// MultipleFiles/patient_profile.js
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication using AuthManager
    if (typeof AuthManager === 'undefined') {
        showCustomAlert('Authentication system not loaded. Please refresh the page.', 'error');
        window.location.href = 'signin.html';
        return;
    }
    
    // Ensure the user is logged in and is a patient
    if (!AuthManager.checkAuthAndRedirect('patient')) {
        return;
    }

    const currentUser = AuthManager.getCurrentUser();

    // Elements for profile information
    const patientNameElem = document.querySelector('.patient-name');
    const patientEmailElem = document.querySelector('.patient-email');
    const memberDateElem = document.getElementById('memberDate');
    const fullNameElem = document.getElementById('fullName');
    const dateOfBirthElem = document.getElementById('dateOfBirth');
    const genderElem = document.getElementById('gender');
    const bloodGroupElem = document.getElementById('bloodGroup');
    const phoneElem = document.getElementById('phone');

    // Elements for appointments section
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const appointmentsMobile = document.getElementById('appointmentsMobile');
    const appointmentsTableBody = document.querySelector('#appointmentsTable tbody');
    const appointmentsTableContainer = document.getElementById('appointmentsTableContainer');

    // Modals and their elements
    const editModal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const editForm = document.getElementById('editForm');
    const modalTitle = document.getElementById('modalTitle');

    const viewModal = document.getElementById('viewModal');
    const closeViewModalBtn = document.getElementById('closeViewModal');
    const closeViewBtn = document.getElementById('closeView');
    const appointmentDetailsDiv = document.getElementById('appointmentDetails');
    const cancelAppointmentBtn = document.getElementById('cancelAppointmentBtn');

    // Buttons
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editPersonalBtn = document.getElementById('editPersonalBtn');

    let patientData = JSON.parse(localStorage.getItem(`patient_data_${currentUser.email}`)) || {
        name: currentUser.name || 'John Doe',
        email: currentUser.email,
        memberSince: 'Jan 2025',
        dob: '1990-01-15',
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '+91 98765 43210'
    };

    let allAppointments = JSON.parse(localStorage.getItem('patient_appointments')) || [];

    // --- Initialization Functions ---
    function initProfile() {
        updateProfileDisplay();
        loadAppointments();
        addEventListeners();
    }

    function updateProfileDisplay() {
        if (patientNameElem) patientNameElem.textContent = patientData.name;
        if (patientEmailElem) patientEmailElem.textContent = patientData.email;
        if (memberDateElem) memberDateElem.textContent = patientData.memberSince;
        if (fullNameElem) fullNameElem.textContent = patientData.name;
        if (dateOfBirthElem) dateOfBirthElem.textContent = formatDateForDisplay(patientData.dob);
        if (genderElem) genderElem.textContent = patientData.gender;
        if (bloodGroupElem) bloodGroupElem.textContent = patientData.bloodGroup;
        if (phoneElem) phoneElem.textContent = patientData.phone;
    }

    function loadAppointments() {
        const patientAppointments = allAppointments.filter(apt => apt.patientEmail === currentUser.email);
        
        // Apply filters
        const filteredAppointments = patientAppointments.filter(apt => {
            const statusMatch = statusFilter.value === '' || apt.status === statusFilter.value;
            const dateMatch = dateFilter.value === '' || apt.date === dateFilter.value;
            return statusMatch && dateMatch;
        });

        // Sort appointments by date (newest first)
        filteredAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));

        renderAppointments(filteredAppointments);
    }

    function renderAppointments(appointments) {
        // Render for mobile cards
        if (appointmentsMobile) {
            appointmentsMobile.innerHTML = '';
            if (appointments.length === 0) {
                appointmentsMobile.innerHTML = getNoAppointmentsMessage();
            } else {
                appointments.forEach(apt => {
                    const card = document.createElement('div');
                    card.className = `appointment-card ${apt.status.toLowerCase()}`;
                    card.innerHTML = `
                        <div class="card-header-mobile">
                            <div>
                                <div class="card-date">${formatDateForDisplay(apt.date)}</div>
                                <div class="card-time">${apt.time}</div>
                            </div>
                            <span class="card-status ${apt.status.toLowerCase()}">${apt.status}</span>
                        </div>
                        <div class="card-body">
                            <div class="card-doctor">${apt.doctor}</div>
                            <div class="card-details">${apt.specialty} at ${apt.hospital}</div>
                            <div class="card-details">Reason: ${apt.reason || 'N/A'}</div>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-small btn-secondary" data-id="${apt.id}" data-action="view">View</button>
                            ${apt.status === 'Pending' || apt.status === 'Confirmed' ? `<button class="btn btn-small btn-danger" data-id="${apt.id}" data-action="cancel">Cancel</button>` : ''}
                        </div>
                    `;
                    appointmentsMobile.appendChild(card);
                });
            }
        }

        // Render for desktop table
        if (appointmentsTableBody) {
            appointmentsTableBody.innerHTML = '';
            if (appointments.length === 0) {
                // Hide table, show no appointments message in table container
                appointmentsTableContainer.innerHTML = getNoAppointmentsMessage();
            } else {
                // Restore table if it was hidden
                if (appointmentsTableContainer.querySelector('.no-appointments')) {
                    appointmentsTableContainer.innerHTML = `
                        <table id="appointmentsTable">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Doctor</th>
                                    <th>Hospital</th>
                                    <th>Specialty</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    `;
                    appointmentsTableBody = document.querySelector('#appointmentsTable tbody'); // Re-select tbody
                }

                appointments.forEach(apt => {
                    const row = appointmentsTableBody.insertRow();
                    row.innerHTML = `
                        <td>${formatDateForDisplay(apt.date)}</td>
                        <td>${apt.time}</td>
                        <td>${apt.doctor}</td>
                        <td>${apt.hospital}</td>
                        <td>${apt.specialty}</td>
                        <td><span class="status-${apt.status.toLowerCase()}">${apt.status}</span></td>
                        <td>
                            <button class="btn btn-small btn-secondary" data-id="${apt.id}" data-action="view">View</button>
                            ${apt.status === 'Pending' || apt.status === 'Confirmed' ? `<button class="btn btn-small btn-danger" data-id="${apt.id}" data-action="cancel">Cancel</button>` : ''}
                        </td>
                    `;
                });
            }
        }
    }

    function getNoAppointmentsMessage() {
        return `
            <div class="no-appointments">
                <i class="fas fa-calendar-times"></i>
                <h3>No appointments found</h3>
                <p>You don't have any appointments matching the current filters.</p>
                <button class="btn btn-primary" onclick="window.location.href='patient-appointment.html'">
                    <i class="fas fa-calendar-plus"></i> Book New Appointment
                </button>
            </div>
        `;
    }

    // --- Event Listeners ---
    function addEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('show');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });
        }

        // Logout buttons
        document.querySelectorAll('.logout-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    AuthManager.logout();
                    showNotification('Logged out successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            });
        });

        // Edit Profile button
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => openEditModal('profile'));
        }

        // Edit Personal Info button
        if (editPersonalBtn) {
            editPersonalBtn.addEventListener('click', () => openEditModal('personal'));
        }

        // Modal close buttons
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
        if (closeViewModalBtn) closeViewModalBtn.addEventListener('click', closeViewModal);
        if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewModal);

        // Edit form submission
        if (editForm) {
            editForm.addEventListener('submit', handleEditSubmit);
        }

        // Filter change listeners
        if (statusFilter) statusFilter.addEventListener('change', loadAppointments);
        if (dateFilter) dateFilter.addEventListener('change', loadAppointments);

        // Delegation for View/Cancel buttons on appointments
        document.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'view') {
                openViewModal(e.target.dataset.id);
            } else if (e.target.dataset.action === 'cancel') {
                confirmCancelAppointment(e.target.dataset.id);
            }
        });

        if (cancelAppointmentBtn) {
            cancelAppointmentBtn.addEventListener('click', () => {
                const appointmentId = cancelAppointmentBtn.dataset.id;
                if (appointmentId) {
                    cancelAppointment(appointmentId);
                }
            });
        }
    }

    // --- Modal Functions ---
    function openEditModal(type) {
        editForm.innerHTML = ''; // Clear previous form fields
        modalTitle.textContent = `Edit ${type === 'profile' ? 'Profile' : 'Personal Information'}`;

        if (type === 'profile') {
            editForm.innerHTML = `
                <div class="form-group">
                    <label for="editName">Full Name:</label>
                    <input type="text" id="editName" value="${patientData.name}" required>
                </div>
                <div class="form-group">
                    <label for="editEmail">Email:</label>
                    <input type="email" id="editEmail" value="${patientData.email}" disabled>
                </div>
            `;
        } else if (type === 'personal') {
            editForm.innerHTML = `
                <div class="form-group">
                    <label for="editDob">Date of Birth:</label>
                    <input type="date" id="editDob" value="${patientData.dob}" required>
                </div>
                <div class="form-group">
                    <label for="editGender">Gender:</label>
                    <select id="editGender" required>
                        <option value="Male" ${patientData.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${patientData.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${patientData.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editBloodGroup">Blood Group:</label>
                    <input type="text" id="editBloodGroup" value="${patientData.bloodGroup}" pattern="^(A|B|AB|O)[+-]$" title="e.g., O+, AB-" required>
                </div>
                <div class="form-group">
                    <label for="editPhone">Phone:</label>
                    <input type="tel" id="editPhone" value="${patientData.phone}" pattern="[0-9]{10}" title="10 digit phone number" required>
                </div>
            `;
        }
        editModal.dataset.editType = type;
        editModal.classList.add('show');
    }

    function closeEditModal() {
        editModal.classList.remove('show');
        editForm.reset();
    }

    function handleEditSubmit(e) {
        e.preventDefault();
        const editType = editModal.dataset.editType;

        if (editType === 'profile') {
            const newName = document.getElementById('editName').value.trim();
            if (newName) {
                patientData.name = newName;
                currentUser.name = newName; // Update current user in AuthManager
                AuthManager.saveCurrentUser(currentUser);
                showNotification('Profile updated successfully!', 'success');
            } else {
                showNotification('Name cannot be empty.', 'error');
                return;
            }
        } else if (editType === 'personal') {
            patientData.dob = document.getElementById('editDob').value;
            patientData.gender = document.getElementById('editGender').value;
            patientData.bloodGroup = document.getElementById('editBloodGroup').value.toUpperCase();
            patientData.phone = document.getElementById('editPhone').value;
            showNotification('Personal information updated successfully!', 'success');
        }

        localStorage.setItem(`patient_data_${currentUser.email}`, JSON.stringify(patientData));
        updateProfileDisplay();
        closeEditModal();
    }

    function openViewModal(appointmentId) {
        const appointment = allAppointments.find(apt => apt.id === appointmentId);
        if (!appointment) {
            showNotification('Appointment not found.', 'error');
            return;
        }

        appointmentDetailsDiv.innerHTML = `
            <div class="appointment-detail">
                <span class="label">Doctor:</span>
                <span class="value">${appointment.doctor}</span>
            </div>
            <div class="appointment-detail">
                <span class="label">Specialty:</span>
                <span class="value">${appointment.specialty}</span>
            </div>
            <div class="appointment-detail">
                <span class="label">Hospital:</span>
                <span class="value">${appointment.hospital}</span>
            </div>
            <div class="appointment-detail">
                <span class="label">Date:</span>
                <span class="value">${formatDateForDisplay(appointment.date)}</span>
            </div>
            <div class="appointment-detail">
                <span class="label">Time:</span>
                <span class="value">${appointment.time}</span>
            </div>
            <div class="appointment-detail">
                <span class="label">Reason:</span>
                <span class="value">${appointment.reason || 'N/A'}</span>
            </div>
            <div class="appointment-detail">
                <span class="label">Status:</span>
                <span class="value status-${appointment.status.toLowerCase()}">${appointment.status}</span>
            </div>
        `;

        if (appointment.status === 'Pending' || appointment.status === 'Confirmed') {
            cancelAppointmentBtn.style.display = 'inline-flex';
            cancelAppointmentBtn.dataset.id = appointmentId;
        } else {
            cancelAppointmentBtn.style.display = 'none';
        }

        viewModal.classList.add('show');
    }

    function closeViewModal() {
        viewModal.classList.remove('show');
        cancelAppointmentBtn.style.display = 'none'; // Hide button on close
        delete cancelAppointmentBtn.dataset.id; // Clear ID
    }

    function confirmCancelAppointment(appointmentId) {
        if (confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
            cancelAppointment(appointmentId);
        }
    }

    function cancelAppointment(appointmentId) {
        const index = allAppointments.findIndex(apt => apt.id === appointmentId && apt.patientEmail === currentUser.email);
        if (index > -1) {
            allAppointments[index].status = 'Cancelled';
            localStorage.setItem('patient_appointments', JSON.stringify(allAppointments));
            showNotification('Appointment cancelled successfully.', 'success');
            closeViewModal();
            loadAppointments(); // Reload appointments to reflect changes
        } else {
            showNotification('Appointment not found or already cancelled.', 'error');
        }
    }

    // --- Utility Functions ---
    function formatDateForDisplay(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type} show`;
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    // Custom alert function (if AuthManager uses it)
    function showCustomAlert(message, type) {
        showNotification(message, type);
    }

    // Initial load of profile and appointments
    initProfile();
});