/* MultipleFiles/app.js */
/* =========================
   Enhanced Hospital and Doctor Data
   ========================= */

// Function to retrieve data from localStorage
function getHospitalsFromLocalStorage() {
  const hospitals = JSON.parse(localStorage.getItem('quickcare_hospitals')) || [];
  const doctors = JSON.parse(localStorage.getItem('doctors')) || [];

  // Map doctors to their respective hospitals
  return hospitals.map(hosp => {
    const hospitalDoctors = doctors.filter(doc => doc.hospital === hosp.id).map(doc => ({
      id: doc.id,
      name: doc.name,
      specialty: doc.specialty,
      fee: doc.fee || 500, // Default fee if not set
      nextInMin: calculateNextAvailability(doc.availability, doc.nextAvailability), // Calculate based on availability
      experience: doc.experience,
      rating: doc.rating || 4.5 // Default rating if not set
    }));
    return {
      id: hosp.id,
      name: hosp.name,
      type: hosp.type,
      city: hosp.city,
      image: "https://placehold.co/600x400/95a5a6/ffffff?text=🏥&font=montserrat", // Placeholder image
      rating: hosp.rating || 4.5, // Default rating
      reviews: hosp.reviews || 100, // Default reviews
      distanceKm: hosp.distanceKm || (Math.random() * 10).toFixed(1), // Random distance
      address: hosp.address,
      phone: hosp.phone,
      doctors: hospitalDoctors
    };
  });
}

// Helper to calculate next availability in minutes based on doctor's status
function calculateNextAvailability(status, nextAvailabilityDate) {
  if (status === 'available') {
    return Math.floor(Math.random() * 30) + 5; // 5-35 minutes
  } else if (status === 'busy') {
    return Math.floor(Math.random() * 60) + 30; // 30-90 minutes
  } else if (status === 'on_leave' && nextAvailabilityDate) {
    const now = new Date();
    const next = new Date(nextAvailabilityDate);
    if (isNaN(next.getTime())) { // Invalid date
        return 24 * 60 * 7; // Default to 7 days if date is invalid
    }
    const diffMs = next.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60))); // Convert ms to minutes
  }
  return 24 * 60; // Default to 24 hours if on leave and no specific date
}


function byEarliestAvailability(matches) {
  const flattened = [];
  matches.forEach(h => {
    h.doctors.forEach(d => {
      flattened.push({
        hospital: h,
        doctor: d,
        // Enhanced combinedScore calculation for better ranking:
        // Prioritize earlier availability and higher rating more.
        // Distance and fee still matter but with slightly less weight.
        combinedScore: (d.nextInMin * 0.5) + (h.distanceKm * 0.2) + (d.fee * 0.0005) + (5 - d.rating) * 10
      });
    });
  });
  
  flattened.sort((a, b) => a.combinedScore - b.combinedScore);
  return flattened.map(item => ({
    hospital: item.hospital,
    doctor: item.doctor
  }));
}

function renderHospitalCards(flatList) {
  const container = document.getElementById("hospitalList");
  if (!container) return;
  container.innerHTML = "";

  if (flatList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <img src="https://placehold.co/200x200/95a5a6/ffffff?text=😕&font=oswald" alt="No results found icon - sad face with magnifying glass" onerror="this.style.display='none'" />
        <h3>No matching hospitals found</h3>
        <p>Try selecting a different specialty or city</p>
      </div>
    `;
    return;
  }

  // Limit to top 5 recommendations, but ensure at least 3 if possible
  const recommendationsCount = Math.max(3, Math.min(5, flatList.length));
  const topRecommendations = flatList.slice(0, recommendationsCount);

  topRecommendations.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "hospital-card";
    card.innerHTML = `
      <div class="hospital-image">
        <img src="${item.hospital.image}" alt="${item.hospital.name} - ${item.hospital.type} hospital in ${item.hospital.city}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/95a5a6/ffffff?text=🏥&font=montserrat'" />
        <div class="hospital-badge">#${index + 1} Recommendation</div>
      </div>
      
      <div class="hospital-content">
        <div class="hospital-header">
          <h3>${item.hospital.name}
            <span class="badge ${item.hospital.type.toLowerCase()}">${item.hospital.type}</span>
          </h3>
          <div class="hospital-rating">
            ⭐ ${item.hospital.rating} (${item.hospital.reviews} reviews)
          </div>
        </div>

        <div class="doctor-info">
          <div class="doctor-avatar">
            <img src="https://placehold.co/60x60/3498db/ffffff?text=👨‍⚕️&font=oswald" alt="Doctor ${item.doctor.name} profile picture" onerror="this.style.display='none'" />
          </div>
          <div class="doctor-details">
            <h4>${item.doctor.name}</h4>
            <p>${item.doctor.specialty.toUpperCase()} • ${item.doctor.experience} years exp • ⭐ ${item.doctor.rating}</p>
          </div>
        </div>

        <div class="hospital-meta">
          <div class="meta-item">
            <span class="icon">⏰</span>
            <span>Next available: <strong>${item.doctor.nextInMin} min</strong></span>
          </div>
          <div class="meta-item">
            <span class="icon">📍</span>
            <span>${item.hospital.distanceKm.toFixed(1)} km away</span>
          </div>
          <div class="meta-item">
            <span class="icon">💰</span>
            <span>₹${item.doctor.fee} consultation fee</span>
          </div>
        </div>

        <div class="hospital-contact">
          <p>📍 ${item.hospital.address}</p>
          <p>📞 ${item.hospital.phone}</p>
        </div>

        <div class="hcard-actions">
          <button class="btn book-btn">Book Appointment</button>
          <button class="btn view-btn">View Profile</button>
        </div>
      </div>
    `;
    
    card.querySelector(".book-btn").addEventListener("click", () => {
      showCustomAlert(`✅ Appointment booked!\n\nHospital: ${item.hospital.name}\nDoctor: ${item.doctor.name}\nSpecialty: ${item.doctor.specialty}\nTime: ~${item.doctor.nextInMin} min\nFee: ₹${item.doctor.fee}`, 'success');
      
      // Save appointment for current patient
      const currentUser = AuthManager.getCurrentUser();
      if (currentUser && currentUser.role === "patient") {
        const appointmentDetails = {
          doctorName: item.doctor.name,
          specialty: item.doctor.specialty,
          hospitalName: item.hospital.name,
          time: new Date(Date.now() + item.doctor.nextInMin * 60 * 1000).toLocaleString(), // Approximate time
          fee: item.doctor.fee,
          status: "Confirmed" // Initial status
        };
        savePatientAppointment(appointmentDetails, currentUser.email);
      }
    });

    card.querySelector(".view-btn").addEventListener("click", () => {
      showCustomAlert(`👨‍⚕️ Doctor Profile\n\nName: ${item.doctor.name}\nSpecialty: ${item.doctor.specialty}\nExperience: ${item.doctor.experience} years\nRating: ⭐ ${item.doctor.rating}\nFee: ₹${item.doctor.fee}\n\nHospital: ${item.hospital.name}`, 'info');
    });

    container.appendChild(card);
  });
}

// Function to save appointment for current patient
function savePatientAppointment(appointmentDetails, patientEmail) {
  const key = `patient_appointments_${patientEmail}`;
  const appointments = JSON.parse(localStorage.getItem(key) || "[]");
  appointments.push(appointmentDetails);
  localStorage.setItem(key, JSON.stringify(appointments));
}

// Mock AI Symptoms Detector
function symptomsDetector() {
    const symptomInput = document.getElementById('symptomInput');
    const specialtySelect = document.getElementById('specialty');
    const citySelect = document.getElementById('city');
    const symptomOutput = document.getElementById('symptomOutput');

    if (!symptomInput || !specialtySelect || !citySelect || !symptomOutput) return;

    const symptoms = symptomInput.value.toLowerCase();
    let suggestedSpecialty = '';
    let responseMessage = '';

    // Simple rule-based detection
    if (symptoms.includes('fever') || symptoms.includes('cough') || symptoms.includes('cold') || symptoms.includes('flu')) {
        suggestedSpecialty = 'general';
        responseMessage = 'Based on your symptoms, a General Medicine doctor is recommended.';
    } else if (symptoms.includes('skin rash') || symptoms.includes('acne') || symptoms.includes('eczema')) {
        suggestedSpecialty = 'dermatology';
        responseMessage = 'For skin conditions, a Dermatology specialist would be best.';
    } else if (symptoms.includes('chest pain') || symptoms.includes('heart')) {
        suggestedSpecialty = 'cardiology';
        responseMessage = 'Chest pain can be serious. Please consult a Cardiology specialist immediately.';
    } else if (symptoms.includes('bone') || symptoms.includes('joint') || symptoms.includes('fracture')) {
        suggestedSpecialty = 'orthopedics';
        responseMessage = 'An Orthopedics specialist can help with bone and joint issues.';
    } else if (symptoms.includes('child') || symptoms.includes('baby') || symptoms.includes('infant')) {
        suggestedSpecialty = 'pediatrics';
        responseMessage = 'For children, a Pediatrics specialist is recommended.';
    } else if (symptoms.includes('ear') || symptoms.includes('nose') || symptoms.includes('throat')) {
        suggestedSpecialty = 'ent';
        responseMessage = 'An ENT specialist can address issues related to ear, nose, and throat.';
    } else if (symptoms.includes('anxiety') || symptoms.includes('depression') || symptoms.includes('stress')) {
        suggestedSpecialty = 'psychiatry';
        responseMessage = 'For mental health concerns, a Psychiatry specialist can provide support.';
    } else if (symptoms.includes('cancer') || symptoms.includes('tumor')) {
        suggestedSpecialty = 'oncology';
        responseMessage = 'For cancer-related concerns, an Oncology specialist is recommended.';
    } else if (symptoms.includes('brain') || symptoms.includes('nerve') || symptoms.includes('headache')) {
        suggestedSpecialty = 'neurology';
        responseMessage = 'For neurological symptoms, a Neurology specialist is advised.';
    } else if (symptoms.includes('x-ray') || symptoms.includes('mri') || symptoms.includes('ultrasound')) {
        suggestedSpecialty = 'radiology';
        responseMessage = 'For imaging and diagnostic services, a Radiology specialist is needed.';
    } else if (symptoms.includes('pregnancy') || symptoms.includes('women health')) {
        suggestedSpecialty = 'gynecology';
        responseMessage = 'For women\'s health and pregnancy, a Gynecology specialist is recommended.';
    }
    else {
        responseMessage = 'Please provide more details, or select a specialty manually.';
        suggestedSpecialty = ''; // Clear suggestion if no match
    }

    symptomOutput.innerHTML = `<p><strong>AI Suggestion:</strong> ${responseMessage}</p>`;
    if (suggestedSpecialty) {
        specialtySelect.value = suggestedSpecialty;
    }
}


document.addEventListener("DOMContentLoaded", () => {
  // Protect this page
  if (typeof AuthManager === 'undefined') {
      showCustomAlert('Authentication system not loaded. Please refresh the page.', 'error');
      window.location.href = 'signin.html';
      return;
  }
  if (!AuthManager.checkAuthAndRedirect('patient')) {
      return;
  }

  const nextBtn = document.getElementById("nextBtn");
  const bookingStep = document.getElementById("bookingStep");
  const hospitalSection = document.getElementById("hospitalSection");
  const symptomDetectBtn = document.getElementById("symptomDetectBtn");

  // Populate specialty and city dropdowns dynamically from available doctors/hospitals
  const allHospitals = getHospitalsFromLocalStorage();
  const allDoctors = allHospitals.flatMap(h => h.doctors);

  const specialtySet = new Set();
  const citySet = new Set();

  allDoctors.forEach(doc => specialtySet.add(doc.specialty));
  allHospitals.forEach(hosp => citySet.add(hosp.city));

  const specialtySelect = document.getElementById('specialty');
  const citySelect = document.getElementById('city');

  // Clear existing options first (if any hardcoded)
  specialtySelect.innerHTML = '<option value="">-- Select Specialty --</option>';
  citySelect.innerHTML = '<option value="">-- Select City --</option>';

  Array.from(specialtySet).sort().forEach(spec => {
      const option = document.createElement('option');
      option.value = spec;
      option.textContent = spec.charAt(0).toUpperCase() + spec.slice(1);
      specialtySelect.appendChild(option);
  });

  Array.from(citySet).sort().forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city.charAt(0).toUpperCase() + city.slice(1);
      citySelect.appendChild(option);
  });


  if (nextBtn && bookingStep && hospitalSection) {
    nextBtn.addEventListener("click", () => {
      const spec = (document.getElementById("specialty").value || "").toLowerCase();
      const city = (document.getElementById("city").value || "").toLowerCase();

      if (!spec || !city) {
        showCustomAlert("⚠️ Please select both Specialty and City.", 'warning');
        return;
      }

      // Filter by city and specialty using the dynamically loaded data
      const candidateHospitals = getHospitalsFromLocalStorage()
        .filter(h => h.city === city)
        .map(h => ({
          ...h,
          doctors: h.doctors.filter(d => d.specialty === spec)
        }))
        .filter(h => h.doctors.length > 0);

      const ranked = byEarliestAvailability(candidateHospitals);

      bookingStep.style.display = "none";
      hospitalSection.style.display = "block";
      renderHospitalCards(ranked);
    });
  }

  if (symptomDetectBtn) {
    symptomDetectBtn.addEventListener('click', symptomsDetector);
  }
});