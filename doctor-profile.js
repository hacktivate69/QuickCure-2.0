// MultipleFiles/doctor-profile.js
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication using AuthManager
    if (typeof AuthManager === 'undefined') {
        showCustomAlert('Authentication system not loaded. Please refresh the page.', 'error');
        window.location.href = 'signin.html'; // Redirect to signin if AuthManager is missing
        return;
    }
    
    // Ensure the user is logged in and is a doctor
    if (!AuthManager.checkAuthAndRedirect('doctor')) {
        return; // Stop execution if not authenticated or not a doctor
    }

    // Initialize doctor profile
    window.doctorProfile = new DoctorProfile();
});

class DoctorProfile {
    constructor() {
        this.currentUser = AuthManager.getCurrentUser(); // Get current user from AuthManager
        
        // Initialize data from localStorage first
        this.profileData = JSON.parse(localStorage.getItem(`doctor_profile_${this.currentUser.id}`)) || this.getDefaultProfile();
        this.availability = JSON.parse(localStorage.getItem(`doctor_availability_${this.currentUser.id}`)) || [];
        this.appointments = JSON.parse(localStorage.getItem(`doctor_appointments_${this.currentUser.id}`)) || [];
        this.prescriptions = JSON.parse(localStorage.getItem(`doctor_prescriptions_${this.currentUser.id}`)) || [];
        this.earnings = JSON.parse(localStorage.getItem(`doctor_earnings_${this.currentUser.id}`)) || {
            today: { amount: 0, consultations: 0 },
            weekly: { amount: 0, consultations: 0 }
        };
        
        this.editingAvailabilityId = null;
        this.selectedAppointment = null;

        this.initializeDemoData(); // Populate demo data if storage is empty
        this.initializeEventListeners();
        this.loadAllData(); // Load and display all data on page load
    }

    // Utility to truncate text for table display
    truncateText(text, maxLength) {
        if (!text) return '';
        // Fix: Only truncate if text length exceeds maxLength
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    // Default profile data for a new doctor
    getDefaultProfile() {
        return {
            name: this.currentUser.name || 'Dr. [Your Name]',
            speciality: 'General Medicine',
            experience: 5,
            email: this.currentUser.email,
            phone: '+91-XXXXXXXXXX',
            address: 'Your Clinic Address, City, State'
        };
    }

    // Initializes sample data if localStorage is empty for this doctor
    initializeDemoData() {
        // Only add demo availability if none exists for this doctor
        if (this.availability.length === 0) {
            const today = new Date();
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                this.availability.push({
                    id: Date.now() + i, // Simple unique ID
                    date: date.toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '17:00',
                    duration: 30,
                    fee: 500
                });
            }
            this.saveAvailability();
        }

        // Only add demo appointments if none exists for this doctor
        if (this.appointments.length === 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            this.appointments = [
                { id: 1, date: todayStr, time: '10:30', patientName: 'John Doe', patientId: 'patient@example.com', type: 'Follow-up', fee: 500, status: 'completed' },
                { id: 2, date: todayStr, time: '11:00', patientName: 'Jane Smith', patientId: 'jane@example.com', type: 'Consultation', fee: 600, status: 'completed' },
                { id: 3, date: todayStr, time: '14:30', patientName: 'Mike Johnson', patientId: 'mike@example.com', type: 'Regular Checkup', fee: 500, status: 'confirmed' },
                { id: 4, date: todayStr, time: '15:00', patientName: 'Sarah Wilson', patientId: 'sarah@example.com', type: 'Emergency', fee: 800, status: 'pending' },
                { id: 5, date: todayStr, time: '16:00', patientName: 'David Brown', patientId: 'david@example.com', type: 'Consultation', fee: 500, status: 'completed' }
            ];
            this.saveAppointments();
        }

        // Only add demo prescriptions if none exists for this doctor
        if (this.prescriptions.length === 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            this.prescriptions = [
                { id: 'p1', date: todayStr, patientId: 'patient@example.com', patientName: 'John Doe', doctorId: this.currentUser.id, doctorName: this.profileData.name, medicines: 'Paracetamol 500mg - 1 tab after food\nAmoxicillin 250mg - 1 cap twice daily', notes: 'Take plenty of rest.' },
                { id: 'p2', date: todayStr, patientId: 'jane@example.com', patientName: 'Jane Smith', doctorId: this.currentUser.id, doctorName: this.profileData.name, medicines: 'Ibuprofen 400mg - 1 tab as needed\nAntacid - 1 tab before food', notes: 'Avoid spicy food.' }
            ];
            this.savePrescriptions();
        }

        // Recalculate earnings based on potentially new demo appointments
        this.calculateEarnings();
    }

    // Sets up all event listeners for the page
    initializeEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click from immediately closing menu via document listener
                mobileMenu.classList.toggle('show');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu && mobileMenuBtn && !mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('show');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Profile edit modal
        document.getElementById('editProfileBtn')?.addEventListener('click', () => this.showProfileModal());
        document.getElementById('closeProfileModal')?.addEventListener('click', () => this.hideProfileModal());
        document.getElementById('cancelProfileBtn')?.addEventListener('click', () => this.hideProfileModal());
        document.getElementById('profileForm')?.addEventListener('submit', (e) => this.handleProfileSubmit(e));

        // Availability management modal
        document.getElementById('addAvailabilityBtn')?.addEventListener('click', () => this.showAvailabilityModal());
        document.getElementById('closeAvailabilityModal')?.addEventListener('click', () => this.hideAvailabilityModal());
        document.getElementById('cancelAvailabilityBtn')?.addEventListener('click', () => this.hideAvailabilityModal());
        document.getElementById('availabilityForm')?.addEventListener('submit', (e) => this.handleAvailabilitySubmit(e));

        // Appointment filters
        document.getElementById('appointmentDate')?.addEventListener('change', () => this.loadAppointments());
        document.getElementById('appointmentStatus')?.addEventListener('change', () => this.loadAppointments());

        // Prescription modals and actions
        document.getElementById('issuePrescriptionBtn')?.addEventListener('click', () => this.showPrescriptionModal());
        document.getElementById('closePrescriptionModal')?.addEventListener('click', () => this.hidePrescriptionModal());
        document.getElementById('cancelPrescriptionBtn')?.addEventListener('click', () => this.hidePrescriptionModal());
        document.getElementById('prescriptionForm')?.addEventListener('submit', (e) => this.handlePrescriptionSubmit(e));
        
        document.getElementById('closeViewPrescriptionModal')?.addEventListener('click', () => this.hideViewPrescriptionModal());
        document.getElementById('simulateDeliveryBtn')?.addEventListener('click', () => this.simulateMedicineDelivery());

        // Appointment details modal
        document.getElementById('closeAppointmentModal')?.addEventListener('click', () => this.hideAppointmentModal());
        document.getElementById('cancelAppointmentBtn')?.addEventListener('click', () => this.cancelAppointment());
        document.getElementById('completeAppointmentBtn')?.addEventListener('click', () => this.completeAppointment());

        // Logout buttons (all elements with class 'logout-btn')
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                AuthManager.logout();
            });
        });

        // Smooth scrolling for anchor links in navigation
        document.querySelectorAll('.nav a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Close modals on outside click (generic for all modals)
        document.addEventListener('click', (e) => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const modalContent = modal.querySelector('.modal-content');
                // If click is outside modal content but inside the modal overlay
                if (modalContent && !modalContent.contains(e.target) && modal.contains(e.target)) {
                    modal.classList.remove('show');
                }
            });
        });

        // Handle window resize for mobile menu behavior
        window.addEventListener('resize', this.debounce(() => {
            if (window.innerWidth > 768) {
                mobileMenu?.classList.remove('show');
                const icon = mobileMenuBtn?.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
            // No need to reload appointments on resize unless table structure changes significantly
        }, 250));
    }

    // Debounce function to limit how often a function is called
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Loads all data sections on page load
    loadAllData() {
        this.loadProfileDetails();
        this.loadAvailabilityList();
        this.loadAppointments();
        this.loadEarningsStats();
        this.loadPrescriptions();
    }

    // --- Prescription Methods ---
    loadPrescriptions() {
        const tbody = document.getElementById('prescriptionTableBody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Clear existing rows

        if (this.prescriptions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 30px; color: #666;">
                        No prescriptions issued yet.
                    </td>
                </tr>
            `;
            return;
        }

        // Sort prescriptions by date (newest first)
        const sortedPrescriptions = [...this.prescriptions].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedPrescriptions.forEach(prescription => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(prescription.date)}</td>
                <td>${this.escapeHtml(prescription.patientName)}</td>
                <td>${this.escapeHtml(this.truncateText(prescription.medicines.split('\n')[0], 30))}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="doctorProfile.viewPrescription('${prescription.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showPrescriptionModal() {
        const modal = document.getElementById('prescriptionModal');
        const patientSelect = document.getElementById('prescriptionPatient');
        if (!modal || !patientSelect) return;

        patientSelect.innerHTML = '<option value="">-- Select Patient --</option>';

        // Populate patients from appointments (assuming these are the doctor's patients)
        const uniquePatients = [];
        this.appointments.forEach(apt => {
            // Use patientId if available, otherwise fallback to patientName
            const patientIdentifier = apt.patientId || apt.patientName;
            if (!uniquePatients.some(p => p.id === patientIdentifier)) {
                uniquePatients.push({ id: patientIdentifier, name: apt.patientName });
            }
        });

        // Sort patients alphabetically
        uniquePatients.sort((a, b) => a.name.localeCompare(b.name));

        uniquePatients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = patient.name;
            patientSelect.appendChild(option);
        });

        const prescriptionForm = document.getElementById('prescriptionForm');
        if (prescriptionForm) prescriptionForm.reset(); // Clear form fields
        modal.classList.add('show');
    }

    hidePrescriptionModal() {
        document.getElementById('prescriptionModal')?.classList.remove('show');
    }

    handlePrescriptionSubmit(e) {
        e.preventDefault();
        const patientIdElement = document.getElementById('prescriptionPatient');
        const medicinesElement = document.getElementById('prescriptionMedicines');
        const notesElement = document.getElementById('prescriptionNotes');

        if (!patientIdElement || !medicinesElement || !notesElement) {
            showCustomAlert('Form elements not found.', 'error');
            return;
        }

        const patientId = patientIdElement.value;
        const patientName = patientIdElement.options[patientIdElement.selectedIndex].text;
        const medicines = medicinesElement.value.trim();
        const notes = notesElement.value.trim();

        if (!patientId || !medicines) {
            showCustomAlert('Please select a patient and enter medicines.', 'error');
            return;
        }

        const newPrescription = {
            id: Date.now().toString(), // Unique ID for the prescription
            date: new Date().toISOString().split('T')[0], // Current date
            patientId: patientId,
            patientName: patientName,
            doctorId: this.currentUser.id, // Doctor's ID from current user
            doctorName: this.profileData.name, // Doctor's name from profile
            medicines: medicines,
            notes: notes
        };

        this.prescriptions.push(newPrescription);
        this.savePrescriptions();
        this.loadPrescriptions(); // Refresh the prescription list
        this.hidePrescriptionModal();
        showCustomAlert('Prescription issued successfully!', 'success');
    }

    viewPrescription(id) {
        const prescription = this.prescriptions.find(p => p.id === id);
        if (!prescription) {
            showCustomAlert('Prescription not found.', 'error');
            return;
        }

        const detailsDiv = document.getElementById('viewPrescriptionDetails');
        if (!detailsDiv) return;

        detailsDiv.innerHTML = `
            <div class="info-row"><label>Date:</label><span>${this.formatDate(prescription.date)}</span></div>
            <div class="info-row"><label>Patient:</label><span>${this.escapeHtml(prescription.patientName)}</span></div>
            <div class="info-row"><label>Doctor:</label><span>${this.escapeHtml(prescription.doctorName)}</span></div>
            <div class="info-row"><label>Medicines:</label><pre>${this.escapeHtml(prescription.medicines)}</pre></div>
            <div class="info-row"><label>Notes:</label><p>${this.escapeHtml(prescription.notes || 'N/A')}</p></div>
        `;
        document.getElementById('viewPrescriptionModal')?.classList.add('show');
    }

    hideViewPrescriptionModal() {
        document.getElementById('viewPrescriptionModal')?.classList.remove('show');
    }

    simulateMedicineDelivery() {
        showCustomAlert('Simulating medicine delivery... Order placed!', 'info');
        this.hideViewPrescriptionModal();
        // In a real app, this would trigger a backend process for delivery
    }

    // --- Profile Methods ---
    loadProfileDetails() {
        // Get elements by ID and update their text content
        document.getElementById('profileName').textContent = this.profileData.name;
        document.getElementById('profileSpeciality').textContent = this.profileData.speciality;
        document.getElementById('profileExperience').textContent = `${this.profileData.experience} years`;
        document.getElementById('profileEmail').textContent = this.profileData.email;
        document.getElementById('profilePhone').textContent = this.profileData.phone;
        document.getElementById('profileAddress').textContent = this.profileData.address;
    }

    showProfileModal() {
        // Populate modal form fields with current profile data
        document.getElementById('editName').value = this.profileData.name;
        document.getElementById('editSpeciality').value = this.profileData.speciality;
        document.getElementById('editExperience').value = this.profileData.experience;
        document.getElementById('editEmail').value = this.profileData.email; // Email is read-only
        document.getElementById('editPhone').value = this.profileData.phone;
        document.getElementById('editAddress').value = this.profileData.address;
        
        document.getElementById('profileModal')?.classList.add('show');
    }

    hideProfileModal() {
        document.getElementById('profileModal')?.classList.remove('show');
    }

    handleProfileSubmit(e) {
        e.preventDefault(); // Prevent default form submission behavior

        // Get updated values from the form
        const updatedName = document.getElementById('editName').value.trim();
        const updatedSpeciality = document.getElementById('editSpeciality').value.trim();
        const updatedExperience = parseInt(document.getElementById('editExperience').value, 10);
        const updatedPhone = document.getElementById('editPhone').value.trim();
        const updatedAddress = document.getElementById('editAddress').value.trim();

        // Basic validation
        if (!updatedName || !updatedSpeciality || isNaN(updatedExperience) || updatedExperience < 0 || !updatedPhone || !updatedAddress) {
            showCustomAlert('Please fill all required profile fields correctly.', 'error');
            return;
        }

        // Update profileData object
        this.profileData = {
            ...this.profileData, // Keep existing email
            name: updatedName,
            speciality: updatedSpeciality,
            experience: updatedExperience,
            phone: updatedPhone,
            address: updatedAddress
        };

        this.saveProfile(); // Save updated profile to localStorage
        this.loadProfileDetails(); // Refresh displayed profile details
        this.hideProfileModal(); // Close the modal
        showCustomAlert('Profile updated successfully!', 'success');
    }

    // --- Availability Methods ---
    loadAvailabilityList() {
        const availabilityList = document.getElementById('availabilityList');
        if (!availabilityList) return;

        availabilityList.innerHTML = ''; // Clear existing items

        if (this.availability.length === 0) {
            availabilityList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-calendar-plus" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No availability set yet.</p>
                    <p>Click "Add Availability" to set your working hours.</p>
                </div>
            `;
            return;
        }

        // Sort availability by date and then start time
        const sortedAvailability = [...this.availability].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime}`);
            const dateB = new Date(`${b.date}T${b.startTime}`);
            return dateA - dateB;
        });

        sortedAvailability.forEach(item => {
            const availabilityItem = document.createElement('div');
            availabilityItem.className = 'availability-item';
            availabilityItem.innerHTML = `
                <div class="availability-info">
                    <h3>${this.formatDate(item.date)}</h3>
                    <div class="availability-details">
                        <span><i class="fas fa-clock"></i> ${item.startTime} - ${item.endTime}</span>
                        <span><i class="fas fa-hourglass-half"></i> ${item.duration} min</span>
                        <span><i class="fas fa-rupee-sign"></i> ₹${item.fee}</span>
                    </div>
                </div>
                <div class="availability-actions">
                    <button class="btn btn-small btn-secondary" onclick="doctorProfile.editAvailability('${item.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="doctorProfile.deleteAvailability('${item.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            availabilityList.appendChild(availabilityItem);
        });
    }

    showAvailabilityModal(editId = null) {
        this.editingAvailabilityId = editId;
        const modal = document.getElementById('availabilityModal');
        const title = document.getElementById('availabilityModalTitle');
        const availabilityForm = document.getElementById('availabilityForm');
        const availabilityDate = document.getElementById('availabilityDate');
        const startTime = document.getElementById('startTime');
        const endTime = document.getElementById('endTime');
        const consultationDuration = document.getElementById('consultationDuration');
        const consultationFee = document.getElementById('consultationFee');

        if (!modal || !title || !availabilityForm || !availabilityDate || !startTime || !endTime || !consultationDuration || !consultationFee) {
            showCustomAlert('Availability form elements not found.', 'error');
            return;
        }

        if (editId) {
            title.textContent = 'Edit Availability';
            const item = this.availability.find(a => a.id == editId); // Use == for potential type coercion
            if (item) {
                availabilityDate.value = item.date;
                startTime.value = item.startTime;
                endTime.value = item.endTime;
                consultationDuration.value = item.duration;
                consultationFee.value = item.fee;
            } else {
                showCustomAlert('Availability slot not found for editing.', 'error');
                this.editingAvailabilityId = null; // Reset if not found
                title.textContent = 'Add Availability'; // Fallback to add mode
                availabilityForm.reset();
            }
        } else {
            title.textContent = 'Add Availability';
            availabilityForm.reset();
            // Set default date to tomorrow and default times/fee
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            availabilityDate.value = tomorrow.toISOString().split('T')[0];
            startTime.value = '09:00';
            endTime.value = '17:00';
            consultationFee.value = '500';
        }

        modal.classList.add('show');
    }

    hideAvailabilityModal() {
        document.getElementById('availabilityModal')?.classList.remove('show');
        this.editingAvailabilityId = null; // Always reset edit ID on close
    }

    handleAvailabilitySubmit(e) {
        e.preventDefault();
        const availabilityDate = document.getElementById('availabilityDate');
        const startTime = document.getElementById('startTime');
        const endTime = document.getElementById('endTime');
        const consultationDuration = document.getElementById('consultationDuration');
        const consultationFee = document.getElementById('consultationFee');

        if (!availabilityDate || !startTime || !endTime || !consultationDuration || !consultationFee) {
            showCustomAlert('Availability form elements not found.', 'error');
            return;
        }

        const newAvailability = {
            id: this.editingAvailabilityId || Date.now().toString(), // Ensure ID is string
            date: availabilityDate.value,
            startTime: startTime.value,
            endTime: endTime.value,
            duration: parseInt(consultationDuration.value, 10),
            fee: parseInt(consultationFee.value, 10)
        };

        // Basic time validation
        if (newAvailability.startTime >= newAvailability.endTime) {
            showCustomAlert('Start time must be before end time.', 'error');
            return;
        }

        // Check for overlapping availability slots (simple check)
        const isOverlapping = this.availability.some(slot => {
            if (slot.id === newAvailability.id) return false; // Don't check against itself when editing
            return slot.date === newAvailability.date &&
                   ((newAvailability.startTime < slot.endTime && newAvailability.endTime > slot.startTime));
        });

        if (isOverlapping) {
            showCustomAlert('This availability slot overlaps with an existing one on the same day.', 'error');
            return;
        }

        if (this.editingAvailabilityId) {
            const index = this.availability.findIndex(item => item.id === this.editingAvailabilityId);
            if (index !== -1) {
                this.availability[index] = newAvailability;
                showCustomAlert('Availability updated successfully!', 'success');
            } else {
                showCustomAlert('Error: Availability slot not found for update.', 'error');
            }
        } else {
            this.availability.push(newAvailability);
            showCustomAlert('Availability added successfully!', 'success');
        }

        this.saveAvailability();
        this.loadAvailabilityList();
        this.hideAvailabilityModal();
    }

    editAvailability(id) {
        this.showAvailabilityModal(id);
    }

    deleteAvailability(id) {
        if (confirm('Are you sure you want to delete this availability slot? This cannot be undone.')) {
            this.availability = this.availability.filter(item => item.id != id); // Use != for type coercion
            this.saveAvailability();
            this.loadAvailabilityList();
            showCustomAlert('Availability deleted successfully!', 'success');
        }
    }

    // --- Appointment Methods ---
    loadAppointments() {
        const tbody = document.getElementById('appointmentTableBody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Clear existing rows
        const filterDate = document.getElementById('appointmentDate')?.value;
        const filterStatus = document.getElementById('appointmentStatus')?.value;

        let filteredAppointments = this.appointments;

        if (filterDate) {
            filteredAppointments = filteredAppointments.filter(apt => apt.date === filterDate);
        }
        if (filterStatus && filterStatus !== 'all') {
            filteredAppointments = filteredAppointments.filter(apt => apt.status.toLowerCase() === filterStatus.toLowerCase());
        }

        if (filteredAppointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 30px; color: #666;">
                        No appointments found for the selected criteria.
                    </td>
                </tr>
            `;
            return;
        }

        // Sort appointments by date and time (earliest first)
        const sortedAppointments = [...filteredAppointments].sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeA - dateTimeB;
        });

        sortedAppointments.forEach(apt => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(apt.time)}</td>
                <td>${this.escapeHtml(apt.patientName)}</td>
                <td class="hide-mobile">${this.escapeHtml(apt.type)}</td>
                <td class="hide-mobile">₹${this.escapeHtml(apt.fee.toString())}</td>
                <td><span class="status-badge status-${this.escapeHtml(apt.status.toLowerCase())}">${this.escapeHtml(apt.status)}</span></td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="doctorProfile.viewAppointmentDetails('${apt.id}')">
                        <i class="fas fa-info-circle"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    viewAppointmentDetails(id) {
        this.selectedAppointment = this.appointments.find(apt => apt.id == id); // Use == for type coercion
        if (!this.selectedAppointment) {
            showCustomAlert('Appointment details not found.', 'error');
            return;
        }

        const detailsDiv = document.getElementById('appointmentDetails');
        const modal = document.getElementById('appointmentModal');
        const cancelBtn = document.getElementById('cancelAppointmentBtn');
        const completeBtn = document.getElementById('completeAppointmentBtn');

        if (!detailsDiv || !modal || !cancelBtn || !completeBtn) {
            showCustomAlert('Appointment modal elements not found.', 'error');
            return;
        }

        detailsDiv.innerHTML = `
            <p><strong>Patient:</strong> ${this.escapeHtml(this.selectedAppointment.patientName)}</p>
            <p><strong>Date:</strong> ${this.formatDate(this.selectedAppointment.date)}</p>
            <p><strong>Time:</strong> ${this.escapeHtml(this.selectedAppointment.time)}</p>
            <p><strong>Type:</strong> ${this.escapeHtml(this.selectedAppointment.type)}</p>
            <p><strong>Fee:</strong> ₹${this.escapeHtml(this.selectedAppointment.fee.toString())}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${this.escapeHtml(this.selectedAppointment.status.toLowerCase())}">${this.escapeHtml(this.selectedAppointment.status)}</span></p>
            ${this.selectedAppointment.reason ? `<p><strong>Reason:</strong> ${this.escapeHtml(this.selectedAppointment.reason)}</p>` : ''}
        `;

        // Enable/disable buttons based on status
        if (this.selectedAppointment.status.toLowerCase() === 'completed' || this.selectedAppointment.status.toLowerCase() === 'cancelled') {
            cancelBtn.style.display = 'none';
            completeBtn.style.display = 'none';
        } else {
            cancelBtn.style.display = 'inline-flex';
            completeBtn.style.display = 'inline-flex';
        }

        modal.classList.add('show');
    }

    hideAppointmentModal() {
        document.getElementById('appointmentModal')?.classList.remove('show');
        this.selectedAppointment = null; // Clear selected appointment on close
    }

    cancelAppointment() {
        if (this.selectedAppointment && confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
            const index = this.appointments.findIndex(apt => apt.id === this.selectedAppointment.id);
            if (index !== -1) {
                this.appointments[index].status = 'cancelled';
                this.saveAppointments();
                this.loadAppointments(); // Refresh appointment list
                this.hideAppointmentModal();
                showCustomAlert('Appointment cancelled.', 'info');
                this.calculateEarnings(); // Recalculate earnings as cancelled appointments don't count
            } else {
                showCustomAlert('Error: Appointment not found for cancellation.', 'error');
            }
        }
    }

    completeAppointment() {
        if (this.selectedAppointment && confirm('Are you sure you want to mark this appointment as complete?')) {
            const index = this.appointments.findIndex(apt => apt.id === this.selectedAppointment.id);
            if (index !== -1) {
                this.appointments[index].status = 'completed';
                this.saveAppointments();
                this.loadAppointments(); // Refresh appointment list
                this.hideAppointmentModal();
                showCustomAlert('Appointment marked as complete.', 'success');
                this.calculateEarnings(); // Recalculate earnings after completion
            } else {
                showCustomAlert('Error: Appointment not found for completion.', 'error');
            }
        }
    }

    // --- Earnings Methods ---
    calculateEarnings() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

        // Calculate start of the current week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        let todayEarnings = 0;
        let todayConsultations = 0;
        let weeklyEarnings = 0;
        let weeklyConsultations = 0;

        this.appointments.forEach(apt => {
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0); // Normalize appointment date

            if (apt.status.toLowerCase() === 'completed') {
                // Check for today's earnings
                if (aptDate.toDateString() === today.toDateString()) {
                    todayEarnings += apt.fee;
                    todayConsultations++;
                }

                // Check for weekly earnings
                if (aptDate >= startOfWeek && aptDate <= today) { // Include today in weekly earnings
                    weeklyEarnings += apt.fee;
                    weeklyConsultations++;
                }
            }
        });

        this.earnings.today.amount = todayEarnings;
        this.earnings.today.consultations = todayConsultations;
        this.earnings.weekly.amount = weeklyEarnings;
        this.earnings.weekly.consultations = weeklyConsultations;

        this.saveEarnings(); // Save updated earnings
        this.loadEarningsStats(); // Update displayed stats
    }

    loadEarningsStats() {
        // Get elements and update their text content with formatted currency and counts
        document.getElementById('todayEarnings').textContent = `₹${this.earnings.today.amount.toLocaleString('en-IN')}`;
        document.getElementById('todayConsultations').textContent = this.earnings.today.consultations;
        document.getElementById('weeklyEarnings').textContent = `₹${this.earnings.weekly.amount.toLocaleString('en-IN')}`;
        document.getElementById('weeklyConsultations').textContent = this.earnings.weekly.consultations;
    }

    // --- Data Persistence (localStorage) ---
    saveProfile() {
        localStorage.setItem(`doctor_profile_${this.currentUser.id}`, JSON.stringify(this.profileData));
    }

    saveAvailability() {
        localStorage.setItem(`doctor_availability_${this.currentUser.id}`, JSON.stringify(this.availability));
    }

    saveAppointments() {
        localStorage.setItem(`doctor_appointments_${this.currentUser.id}`, JSON.stringify(this.appointments));
    }

    savePrescriptions() {
        localStorage.setItem(`doctor_prescriptions_${this.currentUser.id}`, JSON.stringify(this.prescriptions));
    }

    saveEarnings() {
        localStorage.setItem(`doctor_earnings_${this.currentUser.id}`, JSON.stringify(this.earnings));
    }

    // --- Utility Functions ---
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Escape HTML to prevent XSS when inserting user-generated content
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}