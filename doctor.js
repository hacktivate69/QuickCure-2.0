// MultipleFiles/doctor.js
// Doctor Portal JavaScript with Authentication and enhanced filtering
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

    window.doctorPortal = new DoctorPortal();
});

class DoctorPortal {
    constructor() {
        this.currentUser = AuthManager.getCurrentUser(); // Get current user from AuthManager
        
        // Display doctor's name in welcome section
        const welcomeName = document.querySelector('.doctor-name');
        if (welcomeName && this.currentUser) {
            welcomeName.textContent = this.currentUser.name || this.currentUser.email.split('@')[0];
        }

        // Load all doctors (from admin-doctor.js's storage) for filtering purposes
        // This array contains all doctors registered in the system, not just the current one.
        this.allSystemDoctors = JSON.parse(localStorage.getItem('doctors')) || []; 
        
        // Patients specific to this doctor
        this.patients = JSON.parse(localStorage.getItem(`doctor_patients_${this.currentUser.id}`)) || []; 
        
        this.doctorStats = JSON.parse(localStorage.getItem(`doctor_stats_${this.currentUser.id}`)) || {
            totalPatients: 0,
            rating: 4.8 // Default rating
        };

        this.initializeSampleData(); // Initialize sample patients and update stats
        
        this.currentSpecialtyFilter = '';
        this.currentCityFilter = '';

        this.initializeEventListeners();
        this.loadData();
    }

    // Initializes sample patients data if localStorage is empty for this doctor
    initializeSampleData() {
        if (this.patients.length === 0) {
            this.patients = [
                { id: '1', name: 'John Doe', age: 45, lastVisit: '2025-08-20', nextAppointment: '2025-09-10', condition: 'Hypertension', phone: '+91-9876543210', doctorId: this.currentUser.id },
                { id: '2', name: 'Jane Smith', age: 52, lastVisit: '2025-08-25', nextAppointment: '2025-09-05', condition: 'Diabetes', phone: '+91-9876543211', doctorId: this.currentUser.id },
                { id: '3', name: 'Mike Johnson', age: 38, lastVisit: '2025-08-30', nextAppointment: '2025-09-08', condition: 'Chest Pain', phone: '+91-9876543212', doctorId: this.currentUser.id },
                { id: '4', name: 'Sarah Wilson', age: 29, lastVisit: '2025-08-15', nextAppointment: '', condition: 'Regular Checkup', phone: '+91-9876543213', doctorId: this.currentUser.id },
                { id: '5', name: 'David Brown', age: 60, lastVisit: '2025-07-10', nextAppointment: '2025-09-15', condition: 'Arthritis', phone: '+91-9876543214', doctorId: this.currentUser.id },
                { id: '6', name: 'Emily Davis', age: 33, lastVisit: '2025-08-01', nextAppointment: '2025-09-20', condition: 'Migraine', phone: '+91-9876543215', doctorId: this.currentUser.id }
            ];
            this.savePatients();
        }
        this.doctorStats.totalPatients = this.patients.length;
        this.saveDoctorStats();
    }

    initializeEventListeners() {
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
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                AuthManager.logout();
            });
        });

        // Patient search and filter
        const patientSearch = document.getElementById('patientSearch');
        const specialtyFilter = document.getElementById('filterSpecialty');
        const cityFilter = document.getElementById('filterCity');
        const addPatientBtn = document.getElementById('addPatientBtn');

        if (patientSearch) {
            patientSearch.addEventListener('input', () => this.filterPatients());
        }
        if (specialtyFilter) {
            specialtyFilter.addEventListener('change', () => {
                this.currentSpecialtyFilter = specialtyFilter.value;
                this.updateCityOptions(); // Update city options based on selected specialty
                this.filterPatients();
            });
        }
        if (cityFilter) {
            cityFilter.addEventListener('change', () => {
                this.currentCityFilter = cityFilter.value;
                this.filterPatients();
            });
        }
        if (addPatientBtn) {
            addPatientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addPatientPrompt(); // Placeholder for adding patient
            });
        }

        // Event listeners for Prescription, Availability, Appointment sections (if they exist on this page)
        // These sections are primarily managed by doctor-profile.js, but if they are present
        // on doctor.html for summary/quick view, they would need their own data loading logic here.
        // For now, assuming doctor.html only shows patient management and quick stats.
        // If you intend to have full functionality for these sections on doctor.html,
        // you would need to duplicate or refactor the logic from doctor-profile.js.
        // For this fix, I'm assuming doctor.html is a dashboard summary.
        // If you want to populate these tables, you'd need to add methods like:
        // this.loadPrescriptionsSummary();
        // this.loadAvailabilitySummary();
        // this.loadAppointmentsSummary();
        // and their corresponding data structures (e.g., this.prescriptions, this.appointments, this.availability)
        // which would likely be loaded from localStorage, similar to how doctor-profile.js does it.
        // For now, I'm leaving these out of doctor.js to keep concerns separated.
    }

    loadData() {
        this.updateQuickStats();
        this.updateCityOptions(); // Populate initial city options
        this.filterPatients(); // Load patients after filters are set up
    }

    updateQuickStats() {
        document.getElementById('totalPatients').textContent = this.doctorStats.totalPatients;
        const ratingElement = document.getElementById('doctorRating');
        if (ratingElement) ratingElement.textContent = this.doctorStats.rating.toFixed(1); // Format to one decimal place
    }

    filterPatients() {
        const searchTerm = document.getElementById('patientSearch')?.value.toLowerCase() || '';
        let filteredPatients = [...this.patients]; // Create a copy to filter

        // Filter by assigned doctor's specialty and city
        if (this.currentSpecialtyFilter || this.currentCityFilter) {
            filteredPatients = filteredPatients.filter(patient => {
                // Find the doctor assigned to this patient from the allSystemDoctors list
                const assignedDoctor = this.allSystemDoctors.find(d => d.id === patient.doctorId);
                if (!assignedDoctor) return false; // If assigned doctor not found, exclude patient

                const matchesSpecialty = !this.currentSpecialtyFilter || assignedDoctor.specialty === this.currentSpecialtyFilter;
                const matchesCity = !this.currentCityFilter || assignedDoctor.city === this.currentCityFilter;
                return matchesSpecialty && matchesCity;
            });
        }

        // Filter by search term
        if (searchTerm) {
            filteredPatients = filteredPatients.filter(patient =>
                patient.name.toLowerCase().includes(searchTerm) ||
                patient.condition.toLowerCase().includes(searchTerm) ||
                patient.phone.includes(searchTerm)
            );
        }

        this.displayPatientsInTable(filteredPatients);
    }

    displayPatientsInTable(patientsToDisplay) {
        const patientTableBody = document.querySelector('#patients table tbody'); // Use specific ID for clarity
        if (!patientTableBody) return;

        patientTableBody.innerHTML = '';

        if (patientsToDisplay.length === 0) {
            patientTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px;">No patients found matching your criteria.</td></tr>`;
            return;
        }

        patientsToDisplay.sort((a, b) => a.name.localeCompare(b.name));

        patientsToDisplay.forEach(patient => {
            // Find the assigned doctor from the allSystemDoctors list
            const assignedDoctor = this.allSystemDoctors.find(d => d.id === patient.doctorId);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(patient.name)}</td>
                <td>${this.escapeHtml(patient.age.toString())}</td>
                <td>${this.escapeHtml(patient.lastVisit)}</td>
                <td>${this.escapeHtml(patient.nextAppointment || '-')}</td>
                <td>${this.escapeHtml(patient.condition)}</td>
                <td>${this.escapeHtml(patient.phone)}</td>
                <td>${this.escapeHtml(assignedDoctor ? assignedDoctor.name : 'N/A')}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="doctorPortal.viewPatientDetails('${patient.id}')" title="View Patient Details">
                        <i class="fas fa-info-circle"></i> View
                    </button>
                </td>
            `;
            patientTableBody.appendChild(row);
        });
    }

    updateCityOptions() {
        const citySelect = document.getElementById('filterCity');
        if (!citySelect) return;

        let cities = [];
        // Filter cities based on the selected specialty from all available doctors
        if (this.currentSpecialtyFilter) {
            cities = this.allSystemDoctors
                .filter(d => d.specialty === this.currentSpecialtyFilter)
                .map(d => d.city);
        } else {
            // If no specialty filter, get all cities from all doctors
            cities = this.allSystemDoctors.map(d => d.city);
        }

        const uniqueCities = [...new Set(cities)].sort();

        // Preserve the "All Doctor Cities" option
        const defaultOption = citySelect.querySelector('option[value=""]');
        citySelect.innerHTML = ''; // Clear existing options
        if (defaultOption) {
            citySelect.appendChild(defaultOption);
        } else {
            const newDefault = document.createElement('option');
            newDefault.value = '';
            newDefault.textContent = 'All Doctor Cities';
            citySelect.appendChild(newDefault);
        }

        uniqueCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city.charAt(0).toUpperCase() + city.slice(1);
            citySelect.appendChild(option);
        });

        // Reset city filter if the previously selected city is no longer available for the chosen specialty
        if (this.currentCityFilter && !uniqueCities.includes(this.currentCityFilter)) {
            citySelect.value = '';
            this.currentCityFilter = '';
        } else {
            citySelect.value = this.currentCityFilter;
        }
    }

    viewPatientDetails(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (patient) {
            const assignedDoctor = this.allSystemDoctors.find(d => d.id === patient.doctorId);
            showCustomAlert(`
                <strong>Patient Details:</strong><br>
                <strong>Name:</strong> ${this.escapeHtml(patient.name)}<br>
                <strong>Age:</strong> ${this.escapeHtml(patient.age.toString())}<br>
                <strong>Condition:</strong> ${this.escapeHtml(patient.condition)}<br>
                <strong>Phone:</strong> ${this.escapeHtml(patient.phone)}<br>
                <strong>Last Visit:</strong> ${this.escapeHtml(patient.lastVisit)}<br>
                <strong>Next Appointment:</strong> ${this.escapeHtml(patient.nextAppointment || 'N/A')}<br>
                <strong>Assigned Doctor:</strong> ${this.escapeHtml(assignedDoctor ? assignedDoctor.name : 'N/A')}
            `, 'info');
        } else {
            showCustomAlert('Patient details not found.', 'error');
        }
    }

    addPatientPrompt() {
        const newPatientName = prompt("Enter new patient's name:");
        if (newPatientName) {
            const newPatient = {
                id: Date.now().toString(),
                name: newPatientName.trim(),
                age: parseInt(prompt("Enter patient's age:") || '0', 10),
                lastVisit: new Date().toISOString().split('T')[0],
                nextAppointment: '',
                condition: prompt("Enter patient's primary condition:") || 'N/A',
                phone: prompt("Enter patient's phone number:") || 'N/A',
                doctorId: this.currentUser.id // Assign to the current logged-in doctor
            };
            this.patients.push(newPatient);
            this.savePatients();
            this.doctorStats.totalPatients = this.patients.length;
            this.saveDoctorStats();
            this.filterPatients(); // Reload patients to show the new one
            showCustomAlert('Patient added successfully!', 'success');
        } else {
            showCustomAlert('Patient addition cancelled.', 'info');
        }
    }

    // Persistence
    savePatients() {
        localStorage.setItem(`doctor_patients_${this.currentUser.id}`, JSON.stringify(this.patients));
    }

    saveDoctorStats() {
        localStorage.setItem(`doctor_stats_${this.currentUser.id}`, JSON.stringify(this.doctorStats));
    }

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Methods for Prescription, Availability, Appointment sections (if needed on doctor.html) ---
    // These methods would load and display data for the summary tables on doctor.html.
    // They would typically load data from localStorage using keys like:
    // `doctor_prescriptions_${this.currentUser.id}`
    // `doctor_availability_${this.currentUser.id}`
    // `doctor_appointments_${this.currentUser.id}`
    // For a full implementation, you would add these methods and call them in `loadData()`.

    loadPrescriptionsSummary() {
        const tbody = document.getElementById('prescriptionTableBody');
        if (!tbody) return;
        const prescriptions = JSON.parse(localStorage.getItem(`doctor_prescriptions_${this.currentUser.id}`)) || [];
        
        tbody.innerHTML = '';
        if (prescriptions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">No prescriptions.</td></tr>`;
            return;
        }
        // Display a limited number of recent prescriptions
        prescriptions.slice(0, 5).forEach(p => { // Show top 5
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.date}</td>
                <td>${this.escapeHtml(p.patientName)}</td>
                <td>${this.escapeHtml(p.medicines.split('\n')[0])}...</td>
                <td><button class="btn btn-small btn-secondary" onclick="window.location.href='doctor-profile.html#prescriptions'">View</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    loadAvailabilitySummary() {
        const availabilityList = document.getElementById('availabilityList');
        if (!availabilityList) return;
        const availability = JSON.parse(localStorage.getItem(`doctor_availability_${this.currentUser.id}`)) || [];

        availabilityList.innerHTML = '';
        if (availability.length === 0) {
            availabilityList.innerHTML = `<div style="text-align:center; padding:20px;">No availability set.</div>`;
            return;
        }
        // Display a limited number of upcoming availability slots
        availability.slice(0, 3).forEach(a => { // Show top 3
            const div = document.createElement('div');
            div.className = 'availability-item'; // Assuming this class exists in doctor.css
            div.innerHTML = `
                <div class="availability-info">
                    <h3>${a.date}</h3>
                    <div class="availability-details">
                        <span>${a.startTime} - ${a.endTime}</span>
                        <span>${a.duration} min</span>
                        <span>₹${a.fee}</span>
                    </div>
                </div>
                <div class="availability-actions">
                    <button class="btn btn-small btn-secondary" onclick="window.location.href='doctor-profile.html#availability'">Manage</button>
                </div>
            `;
            availabilityList.appendChild(div);
        });
    }

    loadAppointmentsSummary() {
        const tbody = document.getElementById('appointmentTableBody');
        if (!tbody) return;
        const appointments = JSON.parse(localStorage.getItem(`doctor_appointments_${this.currentUser.id}`)) || [];

        tbody.innerHTML = '';
        if (appointments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No appointments.</td></tr>`;
            return;
        }
        // Display a limited number of upcoming appointments
        appointments.slice(0, 5).forEach(apt => { // Show top 5
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${apt.time}</td>
                <td>${this.escapeHtml(apt.patientName)}</td>
                <td class="hide-mobile">${this.escapeHtml(apt.type)}</td>
                <td class="hide-mobile">₹${this.escapeHtml(apt.fee.toString())}</td>
                <td><span class="status-badge status-${this.escapeHtml(apt.status.toLowerCase())}">${this.escapeHtml(apt.status)}</span></td>
                <td><button class="btn btn-small btn-secondary" onclick="window.location.href='doctor-profile.html#appointments'">View</button></td>
            `;
            tbody.appendChild(row);
        });
    }
}