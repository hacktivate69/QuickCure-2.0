// MultipleFiles/admin-doctor.js
// Enhanced Admin Doctor Management System with nextAvailability and custom alerts
class DoctorManager {
    constructor() {
        this.doctors = JSON.parse(localStorage.getItem('doctors')) || [];
        this.hospitals = JSON.parse(localStorage.getItem('quickcare_hospitals')) || []; // Load hospitals for dropdown
        this.currentEditId = null;
        this.filteredDoctors = [];
        
        this.initializeSampleData(); // Initialize data (now just ensures array exists)
        this.initializeEventListeners();
        this.populateHospitalDropdown(); // Populate hospital dropdown on load
        this.loadDoctors();
        this.updateStats();
    }

    initializeEventListeners() {
        const addForm = document.getElementById('addDoctorForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddDoctor();
            });
        }

        const search = document.getElementById('doctorSearch');
        if (search) {
            search.addEventListener('input', () => this.filterDoctors());
        }

        const filterSpecialty = document.getElementById('filterSpecialty');
        if (filterSpecialty) {
            filterSpecialty.addEventListener('change', () => this.filterDoctors());
        }

        const filterCity = document.getElementById('filterCity');
        if (filterCity) {
            filterCity.addEventListener('change', () => this.filterDoctors());
        }

        const clearBtn = document.querySelector('.btn.clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.resetForm());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => AuthManager.logout()); // Use AuthManager logout
        }
    }

    // Modified: No longer adds sample doctors, just ensures the array is initialized.
    initializeSampleData() {
        if (!Array.isArray(this.doctors)) {
            this.doctors = [];
        }
    }

    // New: Populates the hospital dropdown in the form
    populateHospitalDropdown() {
        const hospitalSelect = document.getElementById('doctorHospital');
        if (!hospitalSelect) return;

        // Clear existing options except the default one
        hospitalSelect.innerHTML = '<option value="">-- Select Hospital --</option>';

        this.hospitals.forEach(hospital => {
            const option = document.createElement('option');
            option.value = hospital.id;
            option.textContent = hospital.name;
            hospitalSelect.appendChild(option);
        });
    }

    handleAddDoctor() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return; // Stop if validation fails
        }

        if (this.currentEditId) {
            this.updateDoctor(this.currentEditId, formData);
        } else {
            this.addDoctor(formData);
        }

        this.resetForm();
    }

    getFormData() {
        const getValue = (id) => {
            const element = document.getElementById(id);
            return element ? element.value.trim() : '';
        };

        return {
            name: getValue('doctorName'),
            email: getValue('doctorEmail'),
            specialty: getValue('doctorSpecialty'),
            experience: parseInt(getValue('doctorExperience'), 10) || 0, // Ensure number
            hospital: getValue('doctorHospital'),
            city: getValue('doctorCity'),
            qualification: getValue('doctorQualification'),
            availability: getValue('doctorAvailability'),
            nextAvailability: getValue('doctorNextAvailability'), // New field
            bio: getValue('doctorBio'),
            fee: 500, // Default fee, can be added to form if needed
            rating: 4.5 // Default rating, can be added to form if needed
        };
    }

    validateForm(data) {
        this.clearErrors();
        let isValid = true;

        // Basic required field checks
        if (!data.name) {
            this.showError('doctorName', 'Doctor name is required.');
            isValid = false;
        }

        if (!data.email) {
            this.showError('doctorEmail', 'Email address is required.');
            isValid = false;
        } else if (!this.isValidEmail(data.email)) {
            this.showError('doctorEmail', 'Please enter a valid email address.');
            isValid = false;
        } else {
            // Check for duplicate email only if adding a new doctor or changing email on edit
            const isDuplicate = this.doctors.some(d => 
                d.email.toLowerCase() === data.email.toLowerCase() && d.id !== this.currentEditId
            );
            if (isDuplicate) {
                this.showError('doctorEmail', 'A doctor with this email already exists.');
                isValid = false;
            }
        }

        if (!data.specialty) {
            this.showError('doctorSpecialty', 'Please select a specialty.');
            isValid = false;
        }

        if (isNaN(data.experience) || data.experience < 0) {
            this.showError('doctorExperience', 'Please enter valid years of experience (non-negative number).');
            isValid = false;
        }

        if (!data.hospital) {
            this.showError('doctorHospital', 'Please select a hospital.');
            isValid = false;
        }

        if (!data.city) {
            this.showError('doctorCity', 'Please select a city.');
            isValid = false;
        }

        if (!data.qualification) {
            this.showError('doctorQualification', 'Qualification is required.');
            isValid = false;
        }

        if (!data.availability) {
            this.showError('doctorAvailability', 'Please select availability status.');
            isValid = false;
        }

        // nextAvailability is optional, but if provided, validate format (basic)
        if (data.nextAvailability && !this.isValidDateTime(data.nextAvailability)) {
            this.showError('doctorNextAvailability', 'Please enter a valid date and time (e.g., YYYY-MM-DD HH:MM AM/PM).');
            isValid = false;
        }

        return isValid;
    }

    isValidDateTime(dateTimeStr) {
        // Basic regex for YYYY-MM-DD HH:MM AM/PM format
        // This is a simple check and doesn't validate actual date/time validity (e.g., 31st Feb)
        const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} (AM|PM)$/i;
        return regex.test(dateTimeStr);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Insert error message after the input field
        field.parentNode.appendChild(errorDiv);
    }

    clearErrors() {
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    addDoctor(doctorData) {
        const newDoctor = {
            id: Date.now().toString(), // Simple unique ID
            ...doctorData,
            createdAt: new Date().toISOString()
        };

        this.doctors.push(newDoctor);
        this.saveDoctors();
        this.loadDoctors(); // Reload table with new data
        this.updateStats();
        showCustomAlert('Doctor added successfully!', 'success');
    }

    updateDoctor(id, updatedData) {
        const index = this.doctors.findIndex(doctor => doctor.id === id);
        
        if (index !== -1) {
            this.doctors[index] = {
                ...this.doctors[index], // Keep existing properties
                ...updatedData,         // Overlay with updated data
                updatedAt: new Date().toISOString() // Update timestamp
            };
            
            this.saveDoctors();
            this.loadDoctors(); // Reload table
            this.updateStats();
            showCustomAlert('Doctor updated successfully!', 'success');
        }
    }

    editDoctor(id) {
        const doctor = this.doctors.find(d => d.id === id);
        if (!doctor) {
            showCustomAlert('Doctor not found for editing.', 'error');
            return;
        }

        // Populate form fields with doctor data
        document.getElementById('doctorName').value = doctor.name;
        document.getElementById('doctorEmail').value = doctor.email;
        document.getElementById('doctorSpecialty').value = doctor.specialty;
        document.getElementById('doctorExperience').value = doctor.experience;
        document.getElementById('doctorHospital').value = doctor.hospital;
        document.getElementById('doctorCity').value = doctor.city;
        document.getElementById('doctorQualification').value = doctor.qualification;
        document.getElementById('doctorAvailability').value = doctor.availability;
        document.getElementById('doctorNextAvailability').value = doctor.nextAvailability || ''; // Handle optional field
        document.getElementById('doctorBio').value = doctor.bio || ''; // Handle optional field

        this.currentEditId = id; // Set the ID of the doctor being edited
        
        // Change button text to "Update Doctor"
        const addBtn = document.querySelector('.btn.add');
        if (addBtn) {
            addBtn.textContent = 'Update Doctor';
            addBtn.innerHTML = '<i class="fas fa-save"></i> Update Doctor'; // Add icon back
        }

        // Scroll to the form for better UX
        document.querySelector('.doctor-form').scrollIntoView({ behavior: 'smooth' });
    }

    deleteDoctor(id) {
        const doctor = this.doctors.find(d => d.id === id);
        if (!doctor) {
            showCustomAlert('Doctor not found for deletion.', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete Dr. ${doctor.name}? This action cannot be undone.`)) {
            this.doctors = this.doctors.filter(d => d.id !== id);
            this.saveDoctors();
            this.loadDoctors(); // Reload table
            this.updateStats();
            showCustomAlert('Doctor deleted successfully!', 'success');
            // If the deleted doctor was being edited, reset the form
            if (this.currentEditId === id) {
                this.resetForm();
            }
        }
    }

    loadDoctors() {
        const tableBody = document.getElementById('doctorListBody');
        if (!tableBody) return;

        // Determine which list of doctors to display (filtered or all)
        const doctorsToShow = this.filteredDoctors.length > 0 ? this.filteredDoctors : this.doctors;

        // Sort doctors by name for consistent display
        doctorsToShow.sort((a, b) => a.name.localeCompare(b.name));

        if (doctorsToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-user-md"></i>
                        <h3>No doctors found</h3>
                        <p>Add your first doctor to get started or adjust your search criteria.</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Generate table rows using map and join for efficiency
        tableBody.innerHTML = doctorsToShow.map(doctor => `
            <tr>
                <td>
                    <div>
                        <strong>${this.escapeHtml(doctor.name)}</strong>
                        <br>
                        <small style="color: #718096;">${this.escapeHtml(doctor.email)}</small>
                    </div>
                </td>
                <td>
                    <span style="text-transform: capitalize;">
                        ${this.formatSpecialty(doctor.specialty)}
                    </span>
                </td>
                <td>${this.formatHospital(doctor.hospital)}</td>
                <td style="text-transform: capitalize;">${doctor.city}</td>
                <td>${doctor.experience} years</td>
                <td>
                    <span class="status-badge status-${doctor.availability}">
                        ${this.formatAvailability(doctor.availability)}
                    </span>
                </td>
                <td>${doctor.nextAvailability ? this.escapeHtml(doctor.nextAvailability) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="doctorManager.editDoctor('${doctor.id}')" title="Edit Doctor">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="doctorManager.deleteDoctor('${doctor.id}')" title="Delete Doctor">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterDoctors() {
        const searchTerm = document.getElementById('doctorSearch')?.value.toLowerCase() || '';
        const specialtyFilter = document.getElementById('filterSpecialty')?.value || '';
        const cityFilter = document.getElementById('filterCity')?.value || '';

        this.filteredDoctors = this.doctors.filter(doctor => {
            // Check if doctor matches search term in name, email, or qualification
            const matchesSearch = !searchTerm || 
                doctor.name.toLowerCase().includes(searchTerm) ||
                doctor.email.toLowerCase().includes(searchTerm) ||
                doctor.qualification.toLowerCase().includes(searchTerm) ||
                (doctor.bio && doctor.bio.toLowerCase().includes(searchTerm)); // Include bio in search

            // Check if doctor matches selected specialty filter
            const matchesSpecialty = !specialtyFilter || doctor.specialty === specialtyFilter;
            
            // Check if doctor matches selected city filter
            const matchesCity = !cityFilter || doctor.city === cityFilter;

            return matchesSearch && matchesSpecialty && matchesCity;
        });

        this.loadDoctors(); // Re-render the table with filtered results
    }

    resetForm() {
        const form = document.getElementById('addDoctorForm');
        if (form) {
            form.reset(); // Resets all form fields to their initial state
            this.clearErrors(); // Clear any validation error messages
            this.currentEditId = null; // Reset edit mode
            
            // Change button text back to "Add Doctor"
            const addBtn = document.querySelector('.btn.add');
            if (addBtn) {
                addBtn.textContent = 'Add Doctor';
                addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Doctor'; // Add icon back
            }
        }
    }

    updateStats() {
        const totalElement = document.getElementById('totalDoctors');
        const availableElement = document.getElementById('availableDoctors');

        if (totalElement) {
            totalElement.textContent = this.doctors.length;
        }

        if (availableElement) {
            const availableCount = this.doctors.filter(d => d.availability === 'available').length;
            availableElement.textContent = availableCount;
        }
    }

    saveDoctors() {
        localStorage.setItem('doctors', JSON.stringify(this.doctors));
    }

    // Utility function to prevent XSS by escaping HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper to format specialty display
    formatSpecialty(specialty) {
        const specialties = {
            'cardiology': 'Cardiology',
            'dermatology': 'Dermatology',
            'pediatrics': 'Pediatrics',
            'orthopedics': 'Orthopedics',
            'neurology': 'Neurology',
            'general': 'General Medicine',
            'ent': 'ENT',
            'psychiatry': 'Psychiatry',
            'oncology': 'Oncology',
            'radiology': 'Radiology',
            'gynecology': 'Gynecology'
        };
        // Return formatted name or original if not found
        return specialties[specialty] || specialty.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    // Helper to format hospital display
    formatHospital(hospitalId) {
        const hospital = this.hospitals.find(h => h.id === hospitalId);
        return hospital ? hospital.name : 'N/A';
    }

    // Helper to format availability status display
    formatAvailability(availability) {
        const statuses = {
            'available': 'Available',
            'busy': 'Busy',
            'on_leave': 'On Leave'
        };
        // Return formatted name or original if not found
        return statuses[availability] || availability.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }
}

// Global alert function with better design (re-declared for this file's scope if not globally available)
// This function is expected to be provided by auth.js or a shared utility.
// If auth.js is loaded before this script, `showCustomAlert` will be available.
// If not, you might need to define a local placeholder or ensure loading order.
// For this context, assuming it's globally available via auth.js.

// Initialize DoctorManager when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Basic authentication check for admin pages
    // AuthManager.checkAuthAndRedirect handles the redirect if not authenticated or not admin
    if (typeof AuthManager !== 'undefined' && AuthManager.checkAuthAndRedirect('admin')) {
        window.doctorManager = new DoctorManager();
    } else if (typeof AuthManager === 'undefined') {
        // Fallback if AuthManager is not loaded (shouldn't happen if auth.js is linked first)
        alert('Authentication system not loaded. Please refresh the page.');
        window.location.href = 'admin-signin.html';
    }
});