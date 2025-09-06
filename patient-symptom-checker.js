// MultipleFiles/symptom-data.js

// This file contains the data for the simulated symptom checker.
// It maps symptoms to suggested specialties and provides common symptoms.

const SYMPTOM_DATA = {
    commonSymptoms: [
        { id: 'fever', name: 'Fever', keywords: ['fever', 'hot', 'temperature'] },
        { id: 'cough', name: 'Cough', keywords: ['cough', 'coughing', 'sore throat'] },
        { id: 'headache', name: 'Headache', keywords: ['headache', 'migraine', 'head pain'] },
        { id: 'fatigue', name: 'Fatigue', keywords: ['fatigue', 'tiredness', 'exhaustion'] },
        { id: 'nausea', name: 'Nausea/Vomiting', keywords: ['nausea', 'vomiting', 'sick stomach'] },
        { id: 'chest_pain', name: 'Chest Pain', keywords: ['chest pain', 'heart pain', 'tight chest'] },
        { id: 'shortness_of_breath', name: 'Shortness of Breath', keywords: ['shortness of breath', 'difficulty breathing', 'breathless'] },
        { id: 'skin_rash', name: 'Skin Rash', keywords: ['skin rash', 'itchy skin', 'hives'] },
        { id: 'joint_pain', name: 'Joint Pain', keywords: ['joint pain', 'arthritis', 'stiff joints'] },
        { id: 'abdominal_pain', name: 'Abdominal Pain', keywords: ['abdominal pain', 'stomach ache', 'cramps'] },
        { id: 'dizziness', name: 'Dizziness', keywords: ['dizziness', 'vertigo', 'lightheaded'] },
        { id: 'anxiety', name: 'Anxiety/Stress', keywords: ['anxiety', 'stress', 'panic attacks'] },
        { id: 'insomnia', name: 'Insomnia', keywords: ['insomnia', 'sleep problems', 'difficulty sleeping'] },
        { id: 'vision_problems', name: 'Vision Problems', keywords: ['vision problems', 'blurry vision', 'eye strain'] },
        { id: 'ear_pain', name: 'Ear Pain', keywords: ['ear pain', 'ear infection', 'hearing loss'] },
        { id: 'back_pain', name: 'Back Pain', keywords: ['back pain', 'spine pain', 'sciatica'] },
        { id: 'swelling', name: 'Swelling', keywords: ['swelling', 'edema', 'inflamed'] },
        { id: 'frequent_urination', name: 'Frequent Urination', keywords: ['frequent urination', 'bladder issues'] },
        { id: 'weight_loss', name: 'Unexplained Weight Loss', keywords: ['weight loss', 'losing weight'] },
        { id: 'depression', name: 'Depression', keywords: ['depression', 'sadness', 'mood swings'] }
    ],
    
    // Rules to suggest specialties based on selected symptoms
    // More specific rules should come before general ones.
    specialtyRules: [
        {
            symptoms: ['chest_pain', 'shortness_of_breath'],
            suggestedSpecialty: 'cardiology',
            reason: 'Symptoms like chest pain and shortness of breath often indicate heart-related issues.'
        },
        {
            symptoms: ['skin_rash', 'itchy_skin'], // Assuming itchy_skin can be derived from keywords or another symptom
            suggestedSpecialty: 'dermatology',
            reason: 'Skin rashes and itching are primary concerns for dermatologists.'
        },
        {
            symptoms: ['joint_pain', 'swelling'],
            suggestedSpecialty: 'orthopedics', // Could also be rheumatology, but orthopedics is more common for general joint issues
            reason: 'Persistent joint pain and swelling may require an orthopedic evaluation.'
        },
        {
            symptoms: ['anxiety', 'depression', 'insomnia'],
            suggestedSpecialty: 'psychiatry',
            reason: 'Mental health concerns like anxiety, depression, and sleep disorders are treated by psychiatrists.'
        },
        {
            symptoms: ['headache', 'dizziness'],
            suggestedSpecialty: 'neurology',
            reason: 'Severe headaches and dizziness can be symptoms of neurological conditions.'
        },
        {
            symptoms: ['ear_pain', 'sore_throat'], // Assuming sore_throat can be derived from cough keywords
            suggestedSpecialty: 'ent',
            reason: 'Ear pain and throat issues fall under the expertise of ENT specialists.'
        },
        {
            symptoms: ['fever', 'cough', 'fatigue'],
            suggestedSpecialty: 'general', // General medicine for common cold/flu symptoms
            reason: 'Common symptoms like fever, cough, and fatigue are typically managed by a general physician.'
        },
        {
            symptoms: ['abdominal_pain', 'nausea'],
            suggestedSpecialty: 'general', // Could be gastroenterology, but general is a good first step
            reason: 'Abdominal pain and nausea are common symptoms that a general physician can assess.'
        },
        {
            symptoms: ['frequent_urination'],
            suggestedSpecialty: 'general', // Could be urology, but general is a good first step
            reason: 'Frequent urination can be a symptom of various conditions, best checked by a general physician.'
        },
        {
            symptoms: ['weight_loss'],
            suggestedSpecialty: 'general', // Unexplained weight loss needs general assessment first
            reason: 'Unexplained weight loss requires a general medical evaluation.'
        },
        // General fallback rule if no specific match
        {
            symptoms: [], // Empty array means it's a fallback
            suggestedSpecialty: 'general',
            reason: 'Based on your symptoms, a general physician is recommended for initial assessment.'
        }
    ]
};

// Helper function to get specialty name from ID
const getSpecialtyName = (specialtyId) => {
    const specialtiesMap = {
        'cardiology': 'Cardiology',
        'dermatology': 'Dermatology',
        'pediatrics': 'Pediatrics',
        'orthopedics': 'Orthopedics',
        'neurology': 'Neurology',
        'general': 'General Medicine',
        'ent': 'ENT (Ear, Nose, Throat)',
        'psychiatry': 'Psychiatry',
        'oncology': 'Oncology',
        'radiology': 'Radiology',
        'gynecology': 'Gynecology' // Added for completeness if needed elsewhere
    };
    return specialtiesMap[specialtyId] || specialtyId.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

// Export for use in other modules
// Note: In a real module system (like Node.js or Webpack), you'd use `export default SYMPTOM_DATA;`
// For direct browser inclusion, it's fine as a global constant.