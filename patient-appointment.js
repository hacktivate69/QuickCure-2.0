// MultipleFiles/patient-appointment.js
document.addEventListener('DOMContentLoaded', () => {
  // Authentication check
  // AuthManager is expected to be defined in auth.js
  if (typeof AuthManager === 'undefined') {
    alert('Authentication system not loaded. Please refresh the page.');
    window.location.href = 'signin.html'; 
    return;
  }

  if (!AuthManager.checkAuthAndRedirect('patient')) {
    return; 
  }

  // Initialize appointment booking
  window.appointmentBooking = new AppointmentBooking();
});

class AppointmentBooking {
  constructor() {
    // Initialize data from localStorage or with demo data if empty
    this.doctors = JSON.parse(localStorage.getItem('doctors')) || [];
    this.appointments = JSON.parse(localStorage.getItem('patient_appointments')) || [];
    
    this.filteredDoctors = [];
    this.selectedDoctor = null;

    this.initializeDemoData(); 
    this.initializeEventListeners();
    this.loadDoctors(); 
    this.applyFiltersFromURL(); 
  }

  initializeDemoData() {
    // Only add demo doctors if none exist in localStorage
    if (this.doctors.length === 0) {
      this.doctors = [
        {
          id: '1',
          name: 'Dr. Rajesh Sharma',
          specialty: 'Cardiology',
          hospital: 'Apollo Speciality',
          city: 'Delhi',
          experience: 12,
          rating: 4.8,
          fee: 500,
        },
        {
          id: '2',
          name: 'Dr. Priya Singh',
          specialty: 'Pediatrics',
          hospital: 'Fortis Healthcare',
          city: 'Mumbai',
          experience: 8,
          rating: 4.6,
          fee: 400,
        },
        {
          id: '3',
          name: 'Dr. Sunita Nair',
          specialty: 'Dermatology',
          hospital: 'Green Valley Hospital',
          city: 'Mumbai',
          experience: 10,
          rating: 4.7,
          fee: 450,
        },
        {
          id: '4',
          name: 'Dr. Rohan Shah',
          specialty: 'Orthopedics',
          hospital: 'Metro Care Clinic',
          city: 'Delhi',
          experience: 15,
          rating: 4.9,
          fee: 600,
        },
        {
          id: '5',
          name: 'Dr. Kavita Rao',
          specialty: 'Neurology',
          hospital: 'City General Hospital',
          city: 'Bengaluru',
          experience: 6,
          rating: 4.5,
          fee: 350,
        },
        {
          id: '6',
          name: 'Dr. Amit Patel',
          specialty: 'Ophthalmology',
          hospital: 'Vision Care Center',
          city: 'Pune',
          experience: 11,
          rating: 4.7,
          fee: 550,
        },
        {
          id: '7',
          name: 'Dr. Neha Gupta',
          specialty: 'Gynecology',
          hospital: "Women's Wellness Clinic",
          city: 'Delhi',
          experience: 9,
          rating: 4.8,
          fee: 650,
        },
        {
          id: '8',
          name: 'Dr. Vikram Singh',
          specialty: 'Psychiatry',
          hospital: 'Mind Care Hospital',
          city: 'Bengaluru',
          experience: 14,
          rating: 4.6,
          fee: 700,
        },
      ];
      localStorage.setItem('doctors', JSON.stringify(this.doctors));
    }
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

    // Logout buttons (both desktop and mobile)
    document.getElementById('logoutBtnDesktop')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
    });
    document.getElementById('logoutBtnMobile')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
    });

    // Booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBookingSubmit();
      });
    }

    // Modal close buttons
    document.getElementById('closeModal')?.addEventListener('click', () => this.closeBookingModal());
    document.getElementById('cancelBooking')?.addEventListener('click', () => this.closeBookingModal());
    document.getElementById('closeSuccessModal')?.addEventListener('click', () => this.closeSuccessModal());

    // Close modals when clicking outside modal content
    document.getElementById('bookingModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'bookingModal') this.closeBookingModal();
    });
    document.getElementById('successModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'successModal') this.closeSuccessModal();
    });
  }

  loadDoctors() {
    // This function is primarily for initial load. Filters are applied by applyFiltersFromURL.
    this.filteredDoctors = this.doctors; 
    this.displayDoctors();
  }

  applyFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const specialty = urlParams.get('specialty');
    const city = urlParams.get('city');

    let doctorsToFilter = this.doctors;

    if (specialty) {
      doctorsToFilter = doctorsToFilter.filter((doctor) => 
        doctor.specialty.toLowerCase() === specialty.toLowerCase()
      );
    }
    if (city) {
      doctorsToFilter = doctorsToFilter.filter((doctor) => 
        doctor.city.toLowerCase() === city.toLowerCase()
      );
    }
    
    this.filteredDoctors = doctorsToFilter;
    this.displayDoctors();
  }

  displayDoctors() {
    const grid = document.getElementById('doctorsGrid');
    const noResults = document.getElementById('noResults');
    if (!grid || !noResults) return;

    grid.innerHTML = ''; // Clear previous content

    if (this.filteredDoctors.length === 0) {
      grid.style.display = 'none';
      noResults.style.display = 'block';
      return;
    }

    grid.style.display = 'grid'; // Ensure grid is visible
    noResults.style.display = 'none'; // Hide no results message

    this.filteredDoctors.forEach((doctor) => {
      const card = document.createElement('div');
      card.className = 'doctor-card';
      card.innerHTML = `
        <div class="doctor-header">
          <div class="doctor-avatar">
            <i class="fas fa-user-md"></i>
          </div>
          <div class="doctor-info">
            <h3>${doctor.name}</h3>
            <p class="specialty">${doctor.specialty}</p>
          </div>
        </div>
        <div class="doctor-details">
          <p><i class="fas fa-hospital"></i> ${doctor.hospital}</p>
          <p><i class="fas fa-map-marker-alt"></i> ${doctor.city}</p>
          <p><i class="fas fa-star"></i> ${doctor.rating}/5.0 • ${doctor.experience} years exp.</p>
          <p><i class="fas fa-clock"></i> Available for appointments</p>
        </div>
        <div class="doctor-actions">
          <div class="doctor-fee">₹${doctor.fee}</div>
          <button class="btn btn-book" onclick="appointmentBooking.openBookingModal('${doctor.id}')">
            <i class="fas fa-calendar-plus"></i> Book Appointment
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  openBookingModal(doctorId) {
    const doctor = this.doctors.find((d) => d.id === doctorId);
    if (!doctor) {
        this.showNotification('Doctor not found.', 'error');
        return;
    }

    this.selectedDoctor = doctor;

    const modal = document.getElementById('bookingModal');
    const summary = document.getElementById('doctorSummary');

    summary.innerHTML = `
      <h4>${doctor.name} - ${doctor.specialty}</h4>
      <p><i class="fas fa-hospital"></i> ${doctor.hospital}</p>
      <p><i class="fas fa-map-marker-alt"></i> ${doctor.city}</p>
      <p><i class="fas fa-star"></i> ${doctor.rating}/5.0 • ${doctor.experience} years experience</p>
      <p><i class="fas fa-rupee-sign"></i> Consultation Fee: ₹${doctor.fee}</p>
    `;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
      dateInput.min = today;
      dateInput.value = today; // Pre-fill with today's date
    }

    document.getElementById('selectedDoctorId').value = doctorId;
    modal.classList.add('show');
  }

  closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('show');
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) bookingForm.reset(); // Clear form fields
    this.selectedDoctor = null; // Clear selected doctor
  }

  closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('show');
  }

  handleBookingSubmit() {
    const date = document.getElementById('appointmentDate')?.value;
    const time = document.getElementById('appointmentTime')?.value;
    const reason = document.getElementById('appointmentReason')?.value.trim();

    if (!date || !time) {
      this.showNotification('Please select both date and time for your appointment.', 'error');
      return;
    }

    if (!this.selectedDoctor) {
      this.showNotification('Doctor information is missing. Please try again.', 'error');
      return;
    }

    // Basic date validation: ensure date is not in the past
    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    if (selectedDateTime < now) {
        this.showNotification('Please select a future date and time for your appointment.', 'error');
        return;
    }

    const appointment = {
      id: Date.now().toString(), // Unique ID for the appointment
      date,
      time,
      doctor: this.selectedDoctor.name,
      hospital: this.selectedDoctor.hospital,
      specialty: this.selectedDoctor.specialty,
      status: 'Pending', // Appointments are pending until confirmed by doctor/admin
      reason: reason || 'General consultation',
      patientEmail: AuthManager.getCurrentUser().email // Link appointment to current user
    };

    this.appointments.push(appointment);
    localStorage.setItem('patient_appointments', JSON.stringify(this.appointments));

    this.closeBookingModal();
    this.showSuccessModal(appointment);
  }

  showSuccessModal(appointment) {
    const modal = document.getElementById('successModal');
    const details = document.getElementById('appointmentDetails');
    const recommendations = document.getElementById('recommendationsList');

    if (!modal || !details || !recommendations) return;

    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    details.innerHTML = `
      <h4><i class="fas fa-calendar-check"></i> Appointment Details</h4>
      <p><strong>Doctor:</strong> ${appointment.doctor}</p>
      <p><strong>Specialty:</strong> ${appointment.specialty}</p>
      <p><strong>Hospital:</strong> ${appointment.hospital}</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${appointment.time}</p>
      <p><strong>Status:</strong> <span class="status-pending">Pending Confirmation</span></p>
      ${appointment.reason ? `<p><strong>Reason:</strong> ${appointment.reason}</p>` : ''}
    `;

    const specialtyRecommendations = this.getRecommendationsBySpecialty(appointment.specialty);
    recommendations.innerHTML = '';
    specialtyRecommendations.forEach((rec) => {
      const li = document.createElement('li');
      li.textContent = rec;
      recommendations.appendChild(li);
    });

    modal.classList.add('show');
  }

  getRecommendationsBySpecialty(specialty) {
    const recommendations = {
      Cardiology: [
        'Avoid heavy meals 4-6 hours before your appointment',
        'Bring a list of current medications',
        'Wear comfortable, loose-fitting clothing',
        'Bring previous ECG or cardiac test reports if available',
      ],
      Pediatrics: [
        "Bring your child's vaccination record",
        'List any allergies or current medications',
        'Bring a favorite toy or comfort item for your child',
        'Prepare a list of questions or concerns',
      ],
      Dermatology: [
        'Avoid applying makeup or skincare products to affected areas',
        'Bring a list of skincare products you currently use',
        'Take photos of skin changes if they vary day to day',
        'Wear comfortable clothing for easy examination',
      ],
      Orthopedics: [
        'Bring any recent X-rays or imaging reports',
        'Wear comfortable clothing and supportive shoes',
        'List activities that worsen or improve your symptoms',
        'Bring any braces or supports you currently use',
      ],
      Neurology: [
        'Keep a symptom diary leading up to your appointment',
        'Bring a list of all medications and supplements',
        'Bring a family member who can provide additional information',
        'Prepare questions about your symptoms and concerns',
      ],
      Ophthalmology: [
        'Bring your current eyeglasses or contact lenses',
        'Avoid wearing eye makeup on appointment day',
        'Bring a list of any eye medications you use',
        'Consider arranging transportation as eyes may be dilated',
      ],
      Gynecology: [
        'Track your menstrual cycle before the appointment',
        'Prepare questions about reproductive health',
        'Bring a list of current medications',
        'Wear comfortable, easily removable clothing',
      ],
      Psychiatry: [
        'Keep a mood diary for a few days before appointment',
        'List current medications and their effects',
        'Bring a support person if comfortable',
        'Prepare to discuss symptoms openly and honestly',
      ],
      'General Physician': [ // Added for general physician
        'Bring a list of all current medications and supplements',
        'Prepare a list of your symptoms and concerns',
        'Bring any relevant medical records or test results',
        'Be ready to discuss your medical history'
      ],
      'ENT (Ear, Nose, Throat)': [ // Added for ENT
        'Avoid using nasal sprays or ear drops before the appointment unless instructed',
        'Prepare to describe your symptoms in detail (e.g., duration, severity)',
        'Bring any previous hearing test results or imaging scans',
        'Inform the doctor about any allergies'
      ],
      'Oncology': [ // Added for Oncology
        'Bring all relevant medical records, including pathology reports and imaging scans',
        'Prepare a list of questions for the doctor',
        'Consider bringing a family member or friend for support and to take notes',
        'List all current medications, including over-the-counter drugs and supplements'
      ]
    };

    return recommendations[specialty] || [
      'Arrive 15 minutes early for your appointment',
      'Bring a valid ID and insurance card',
      'Prepare a list of current medications',
      'Write down questions you want to ask the doctor',
      'Bring any relevant medical records or test results',
    ];
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

  showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}