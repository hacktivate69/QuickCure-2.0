// MultipleFiles/patient.js
document.addEventListener('DOMContentLoaded', () => {
    // AuthManager is expected to be defined in auth.js
    if (typeof AuthManager === 'undefined') {
        alert('Authentication system not loaded. Please refresh the page.');
        window.location.href = 'signin.html';
        return;
    }

    if (!AuthManager.checkAuthAndRedirect('patient')) {
        return;
    }

    // Initialize patient portal only if authenticated and authorized
    window.patientPortal = new PatientPortal();
});

class PatientPortal {
    constructor() {
        this.currentUser = AuthManager.getCurrentUser();

        // Initialize all data from localStorage or with demo data if empty
        this.appointments = JSON.parse(localStorage.getItem('patient_appointments')) || [];
        this.doctors = JSON.parse(localStorage.getItem('all_doctors')) || []; // Use a new key for all doctors
        this.medicalRecords = JSON.parse(localStorage.getItem('patient_medical_records')) || [];
        this.prescriptions = JSON.parse(localStorage.getItem('doctor_prescriptions')) || []; // Prescriptions issued by doctors

        this.initializeDemoData(); // This will populate `this.doctors` if empty
        this.initializeEventListeners();
        this.updateWelcomeMessage();
        this.updateStats();
        this.setupBookingFlow();
    }

    initializeDemoData() {
        // Only add demo doctors if none exist in localStorage under 'all_doctors'
        if (this.doctors.length === 0) {
            this.doctors = [
                {
                    id: '1',
                    name: 'Dr. Rajesh Sharma',
                    specialty: 'Cardiology',
                    hospital: 'Apollo Speciality Hospital',
                    city: 'chennai',
                    experience: 12,
                    rating: 4.8,
                    fee: 500
                },
                {
                    id: '2',
                    name: 'Dr. Priya Singh',
                    specialty: 'Pediatrics',
                    hospital: 'Fortis Healthcare',
                    city: 'mumbai',
                    experience: 8,
                    rating: 4.6,
                    fee: 400
                },
                {
                    id: '3',
                    name: 'Dr. Sunita Nair',
                    specialty: 'Dermatology',
                    hospital: 'Green Valley Multi-speciality',
                    city: 'mumbai',
                    experience: 10,
                    rating: 4.7,
                    fee: 450
                },
                {
                    id: '4',
                    name: 'Dr. Rohan Shah',
                    specialty: 'Orthopedics',
                    hospital: 'Metro Care Clinic',
                    city: 'delhi',
                    experience: 15,
                    rating: 4.9,
                    fee: 600
                },
                {
                    id: '5',
                    name: 'Dr. Kavita Rao',
                    specialty: 'Neurology',
                    hospital: 'City General Hospital',
                    city: 'delhi', // Changed to Delhi for more variety
                    experience: 6,
                    rating: 4.5,
                    fee: 350
                },
                {
                    id: '6',
                    name: 'Dr. Amit Patel',
                    specialty: 'Ophthalmology',
                    hospital: 'Sunrise Hospital',
                    city: 'hyderabad',
                    experience: 11,
                    rating: 4.7,
                    fee: 550
                },
                {
                    id: '7',
                    name: 'Dr. Neha Gupta',
                    specialty: 'Gynecology',
                    hospital: "Wellness Hospital",
                    city: 'lucknow',
                    experience: 9,
                    rating: 4.8,
                    fee: 650
                },
                {
                    id: '8',
                    name: 'Dr. Vikram Singh',
                    specialty: 'Psychiatry',
                    hospital: 'Global Med Center',
                    city: 'kolkata',
                    experience: 14,
                    rating: 4.6,
                    fee: 700
                },
                {
                    id: '9',
                    name: 'Dr. Anjali Verma',
                    specialty: 'General Medicine',
                    hospital: 'City Care Clinic',
                    city: 'pune',
                    experience: 7,
                    rating: 4.5,
                    fee: 300
                },
                {
                    id: '10',
                    name: 'Dr. Sameer Khan',
                    specialty: 'ENT',
                    hospital: 'National Health Center',
                    city: 'bengaluru',
                    experience: 10,
                    rating: 4.7,
                    fee: 480
                },
                {
                    id: '11',
                    name: 'Dr. Pooja Sharma',
                    specialty: 'Oncology',
                    hospital: 'Apollo Speciality Hospital',
                    city: 'chennai',
                    experience: 18,
                    rating: 4.9,
                    fee: 900
                },
                {
                    id: '12',
                    name: 'Dr. Vivek Kumar',
                    specialty: 'Urology',
                    hospital: 'Fortis Healthcare',
                    city: 'mumbai',
                    experience: 13,
                    rating: 4.7,
                    fee: 750
                }
            ];
            localStorage.setItem('all_doctors', JSON.stringify(this.doctors));
        }

        // Initialize patient appointments if empty
        if (this.appointments.length === 0) {
            this.appointments = [
                {
                    id: '1',
                    date: '2025-09-05',
                    time: '10:15',
                    doctor: 'Dr. Rajesh Sharma',
                    hospital: 'Apollo Speciality',
                    specialty: 'Cardiology',
                    status: 'Confirmed',
                    reason: 'Routine check-up',
                    patientEmail: 'patient@example.com'
                },
                {
                    id: '2',
                    date: '2025-09-08',
                    time: '14:00',
                    doctor: 'Dr. Priya Singh',
                    hospital: 'Fortis Healthcare',
                    specialty: 'Pediatrics',
                    status: 'Pending',
                    reason: 'Child vaccination',
                    patientEmail: 'patient@example.com'
                }
            ];
            localStorage.setItem('patient_appointments', JSON.stringify(this.appointments));
        }

        // Initialize medical records if empty
        if (this.medicalRecords.length === 0) {
            this.medicalRecords = [
                {
                    id: 'rec1',
                    patientId: 'patient@example.com',
                    type: 'Lab Report',
                    date: '2024-07-10',
                    title: 'Blood Test Results',
                    doctor: 'Dr. Generic',
                    notes: 'Cholesterol levels slightly elevated.'
                },
                {
                    id: 'rec2',
                    patientId: 'patient@example.com',
                    type: 'Consultation Summary',
                    date: '2024-06-25',
                    title: 'General Checkup Summary',
                    doctor: 'Dr. Priya Singh',
                    notes: 'Patient in good health. Advised regular exercise.'
                }
            ];
            localStorage.setItem('patient_medical_records', JSON.stringify(this.medicalRecords));
        }

        // Initialize doctor prescriptions if empty (these are prescriptions issued by doctors)
        if (this.prescriptions.length === 0) {
            this.prescriptions = [
                {
                    id: 'presc1',
                    date: '2024-07-15',
                    patientId: 'patient@example.com',
                    patientName: 'John Doe',
                    doctorId: 'rajesh.sharma@healthconnect.com',
                    doctorName: 'Dr. Rajesh Sharma',
                    medicines: 'Medicine A (1-0-1), Medicine B (0-1-0)',
                    notes: 'For fever and body ache.'
                }
            ];
            localStorage.setItem('doctor_prescriptions', JSON.stringify(this.prescriptions));
        }
    }

    initializeEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('show');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });
        }

        // Logout button functionality (both desktop and mobile)
        document.getElementById('logoutBtnDesktop')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        document.getElementById('logoutBtnMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    updateWelcomeMessage() {
        const welcomeName = document.querySelector('.patient-name');
        if (welcomeName && this.currentUser) {
            welcomeName.textContent = this.currentUser.name || this.currentUser.email.split('@')[0];
        }
    }

    setupBookingFlow() {
        const nextBtn = document.getElementById('nextBtn');
        const specialtySelect = document.getElementById('specialty');
        const citySelect = document.getElementById('city');

        // Populate specialty and city dropdowns dynamically from `this.doctors`
        const uniqueSpecialties = [...new Set(this.doctors.map(d => d.specialty))].sort();
        const uniqueCities = [...new Set(this.doctors.map(d => d.city))].sort();

        this.populateDropdown(specialtySelect, uniqueSpecialties, '-- Choose Specialty --');
        this.populateDropdown(citySelect, uniqueCities, '-- Choose City --');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const selectedSpecialty = specialtySelect.value;
                const selectedCity = citySelect.value;

                if (!selectedSpecialty || !selectedCity) {
                    this.showNotification('Please select both specialty and city.', 'error');
                    return;
                }

                // Redirect to patient-appointment.html with selected filters
                window.location.href = `patient-appointment.html?specialty=${encodeURIComponent(selectedSpecialty)}&city=${encodeURIComponent(selectedCity)}`;
            });
        }
    }

    populateDropdown(selectElement, options, defaultText) {
        if (!selectElement) return;

        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            selectElement.appendChild(opt);
        });
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            AuthManager.logout();
            this.showNotification('Logged out successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    updateStats() {
        // Filter for upcoming appointments (current date or later) for the current user
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentUserAppointments = this.appointments.filter(apt => apt.patientEmail === this.currentUser.email);

        const upcomingAppointments = currentUserAppointments.filter(apt => {
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate >= today && (apt.status === 'Confirmed' || apt.status === 'Pending');
        });

        const doctorsConsulted = [...new Set(currentUserAppointments.map(apt => apt.doctor))].length;

        const upcomingElement = document.getElementById('upcomingCount');
        const doctorsElement = document.getElementById('doctorsCount');
        const recordsCountElement = document.getElementById('recordsCount');
        const prescriptionsCountElement = document.getElementById('prescriptionsCount');

        if (upcomingElement) upcomingElement.textContent = upcomingAppointments.length;
        if (doctorsElement) doctorsElement.textContent = doctorsConsulted;

        // Medical records count for the current user
        const currentUserRecords = this.medicalRecords.filter(rec => rec.patientId === this.currentUser.email);
        if (recordsCountElement) recordsCountElement.textContent = currentUserRecords.length;

        // Active prescriptions count for the current user
        const currentUserPrescriptions = this.prescriptions.filter(presc => presc.patientId === this.currentUser.email);
        if (prescriptionsCountElement) prescriptionsCountElement.textContent = currentUserPrescriptions.length;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type} show`;
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }
}