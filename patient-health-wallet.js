document.addEventListener('DOMContentLoaded', () => {
    if (typeof AuthManager === 'undefined' || !AuthManager.checkAuthAndRedirect('patient')) {
        return;
    }

    const currentUser = AuthManager.getCurrentUser();
    const patientId = currentUser.email; // Using email as patient ID for consistency

    const walletTabs = document.querySelectorAll('.wallet-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    const prescriptionsContent = document.getElementById('prescriptionsContent');
    const recordsContent = document.getElementById('recordsContent');
    const noPrescriptionsMessage = document.getElementById('noPrescriptionsMessage');
    const noRecordsMessage = document.getElementById('noRecordsMessage');

    let allPrescriptions = JSON.parse(localStorage.getItem('doctor_prescriptions')) || [];
    let medicalRecords = JSON.parse(localStorage.getItem('patient_medical_records')) || []; // New storage for records

    // Dummy medical records if none exist
    if (medicalRecords.length === 0) {
        medicalRecords = [
            {
                id: 'rec1',
                patientId: 'patient@example.com', // Match current user's email
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
        localStorage.setItem('patient_medical_records', JSON.stringify(medicalRecords));
    }


    walletTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            walletTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(targetTab + 'Content').classList.add('active');

            if (targetTab === 'prescriptions') {
                loadPrescriptions();
            } else if (targetTab === 'records') {
                loadMedicalRecords();
            }
        });
    });

    function loadPrescriptions() {
        prescriptionsContent.innerHTML = ''; // Clear previous content
        const patientPrescriptions = allPrescriptions.filter(p => p.patientId === patientId);

        if (patientPrescriptions.length === 0) {
            noPrescriptionsMessage.style.display = 'block';
            prescriptionsContent.appendChild(noPrescriptionsMessage);
            return;
        }
        noPrescriptionsMessage.style.display = 'none';

        patientPrescriptions.forEach(prescription => {
            const card = document.createElement('div');
            card.className = 'prescription-card';
            card.innerHTML = `
                <h4>Prescription from ${prescription.doctorName} on ${formatDate(prescription.date)}</h4>
                <p><strong>Medicines:</strong> ${truncateText(prescription.medicines.split('\n')[0], 50)}...</p>
                <p><strong>Notes:</strong> ${truncateText(prescription.notes || 'N/A', 50)}...</p>
                <div class="actions">
                    <button class="btn btn-primary btn-small" onclick="viewPrescriptionDetails('${prescription.id}')">View Details</button>
                    <button class="btn btn-secondary btn-small" onclick="simulateMedicineDelivery('${prescription.id}')">Order Medicines</button>
                </div>
            `;
            prescriptionsContent.appendChild(card);
        });
    }

    function loadMedicalRecords() {
        recordsContent.innerHTML = ''; // Clear previous content
        const patientRecords = medicalRecords.filter(r => r.patientId === patientId);

        if (patientRecords.length === 0) {
            noRecordsMessage.style.display = 'block';
            recordsContent.appendChild(noRecordsMessage);
            return;
        }
        noRecordsMessage.style.display = 'none';

        patientRecords.forEach(record => {
            const card = document.createElement('div');
            card.className = 'record-card';
            card.innerHTML = `
                <h4>${record.title} (${record.type})</h4>
                <p><strong>Date:</strong> ${formatDate(record.date)}</p>
                <p><strong>Doctor/Source:</strong> ${record.doctor || 'N/A'}</p>
                <p><strong>Notes:</strong> ${truncateText(record.notes || 'N/A', 100)}...</p>
                <div class="actions">
                    <button class="btn btn-primary btn-small" onclick="viewRecordDetails('${record.id}')">View Details</button>
                </div>
            `;
            recordsContent.appendChild(card);
        });
    }

    // Helper functions (reused from doctor-profile.js or patient.js)
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
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

    // Global functions for buttons (attached to window for direct HTML calls)
    window.viewPrescriptionDetails = function(id) {
        const prescription = allPrescriptions.find(p => p.id === id);
        if (prescription) {
            alert(`Prescription Details:\n\nDate: ${formatDate(prescription.date)}\nDoctor: ${prescription.doctorName}\n\nMedicines:\n${prescription.medicines}\n\nNotes: ${prescription.notes || 'N/A'}`);
        }
    };

    window.simulateMedicineDelivery = function(id) {
        showNotification('Simulating medicine order for prescription ID: ' + id + '. Delivery will be arranged.', 'info');
    };

    window.viewRecordDetails = function(id) {
        const record = medicalRecords.find(r => r.id === id);
        if (record) {
            alert(`Medical Record Details:\n\nType: ${record.type}\nTitle: ${record.title}\nDate: ${formatDate(record.date)}\nDoctor/Source: ${record.doctor || 'N/A'}\n\nNotes:\n${record.notes || 'N/A'}`);
        }
    };

    // Initial load
    loadPrescriptions();

    // Re-use mobile menu logic from patient.js
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
        AuthManager.logout();
        showNotification('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    });
    document.getElementById('logoutBtnMobile')?.addEventListener('click', (e) => {
        e.preventDefault();
        AuthManager.logout();
        showNotification('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    });
});