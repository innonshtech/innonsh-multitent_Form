/**
 * SECTOR FIELD SUGGESTIONS LIBRARY
 * Pre-built field templates for common industry sectors.
 * These are SUGGESTIONS shown to org owners — they can pick any + add their own custom fields.
 */

export const SECTOR_FIELD_SUGGESTIONS = {
  'Automobile': [
    { field_key: 'vehicle_category', field_label: 'Vehicle Category', field_type: 'dropdown', options: ['2-Wheeler', '4-Wheeler', 'Commercial Vehicle', 'Electric Vehicle'], is_required: false },
    { field_key: 'model_interest', field_label: 'Model Interest', field_type: 'text', options: [], is_required: false },
    { field_key: 'fuel_type', field_label: 'Fuel Type', field_type: 'dropdown', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], is_required: false },
    { field_key: 'color_preference', field_label: 'Color Preference', field_type: 'text', options: [], is_required: false },
    { field_key: 'test_drive_required', field_label: 'Test Drive Required', field_type: 'boolean', options: [], is_required: false },
    { field_key: 'test_drive_date', field_label: 'Test Drive Date', field_type: 'date', options: [], is_required: false },
    { field_key: 'budget_range', field_label: 'Budget Range (₹ Lakhs)', field_type: 'number', options: [], is_required: false },
    { field_key: 'exchange_vehicle', field_label: 'Exchange Vehicle Available', field_type: 'boolean', options: [], is_required: false },
    { field_key: 'finance_required', field_label: 'Finance Required', field_type: 'boolean', options: [], is_required: false },
    { field_key: 'dealer_location', field_label: 'Preferred Dealer Location', field_type: 'text', options: [], is_required: false },
  ],



  'Real Estate': [
    { field_key: 'property_type', field_label: 'Property Type', field_type: 'dropdown', options: ['Flat / Apartment', 'Independent Villa', 'Plot / Land', 'Commercial Office', 'Retail Shop', 'Warehouse'], is_required: false },
    { field_key: 'bhk_configuration', field_label: 'BHK Configuration', field_type: 'dropdown', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK', 'Studio'], is_required: false },
    { field_key: 'budget_min', field_label: 'Budget Min (₹ Lakhs)', field_type: 'number', options: [], is_required: false },
    { field_key: 'budget_max', field_label: 'Budget Max (₹ Lakhs)', field_type: 'number', options: [], is_required: false },
    { field_key: 'preferred_location', field_label: 'Preferred Location / Area', field_type: 'text', options: [], is_required: false },
    { field_key: 'possession_timeline', field_label: 'Possession Timeline', field_type: 'dropdown', options: ['Immediate', 'Within 3 Months', 'Within 6 Months', '1 Year', 'Under Construction'], is_required: false },
    { field_key: 'purpose', field_label: 'Purpose', field_type: 'dropdown', options: ['Self Use', 'Investment', 'Rental Income', 'Resale'], is_required: false },
    { field_key: 'loan_required', field_label: 'Home Loan Required', field_type: 'boolean', options: [], is_required: false },
    { field_key: 'carpet_area_sqft', field_label: 'Carpet Area (Sq.Ft)', field_type: 'number', options: [], is_required: false },
    { field_key: 'site_visit_date', field_label: 'Site Visit Date', field_type: 'date', options: [], is_required: false },
  ],

  'Software / IT': [
    { field_key: 'product_interest', field_label: 'Product Interest', field_type: 'dropdown', options: ['SaaS Platform', 'Mobile Application', 'Website / Portal', 'ERP Solution', 'CRM Software', 'Custom Development', 'AI / ML Solution'], is_required: false },
    { field_key: 'company_size', field_label: 'Company Size (Employees)', field_type: 'dropdown', options: ['1–10', '10–50', '50–200', '200–500', '500–1000', '1000+'], is_required: false },
    { field_key: 'tech_stack', field_label: 'Current Tech Stack', field_type: 'text', options: [], is_required: false },
    { field_key: 'demo_required', field_label: 'Demo Required', field_type: 'boolean', options: [], is_required: false },
    { field_key: 'demo_date', field_label: 'Demo Scheduled Date', field_type: 'date', options: [], is_required: false },
    { field_key: 'project_timeline', field_label: 'Project Timeline', field_type: 'dropdown', options: ['Immediate (< 1 month)', '1–3 Months', '3–6 Months', '6+ Months', 'Exploring'], is_required: false },
    { field_key: 'deployment_type', field_label: 'Deployment Preference', field_type: 'dropdown', options: ['Cloud (SaaS)', 'On-Premise', 'Hybrid'], is_required: false },
    { field_key: 'existing_software', field_label: 'Existing Software Used', field_type: 'text', options: [], is_required: false },
    { field_key: 'annual_it_budget', field_label: 'Annual IT Budget (₹)', field_type: 'number', options: [], is_required: false },
  ],

  'Manufacturing': [
    { field_key: 'product_category', field_label: 'Product Category', field_type: 'text', options: [], is_required: false },
    { field_key: 'order_quantity', field_label: 'Order Quantity (Units)', field_type: 'number', options: [], is_required: false },
    { field_key: 'material_type', field_label: 'Raw Material Type', field_type: 'text', options: [], is_required: false },
    { field_key: 'delivery_location', field_label: 'Delivery Location', field_type: 'text', options: [], is_required: false },
    { field_key: 'delivery_deadline', field_label: 'Delivery Deadline', field_type: 'date', options: [], is_required: false },
    { field_key: 'oem_or_aftermarket', field_label: 'OEM or Aftermarket', field_type: 'dropdown', options: ['OEM', 'Aftermarket', 'Both'], is_required: false },
    { field_key: 'quality_certification', field_label: 'Quality Certification Required', field_type: 'text', options: [], is_required: false },
    { field_key: 'annual_volume', field_label: 'Estimated Annual Volume', field_type: 'number', options: [], is_required: false },
  ],

  'Education': [
    { field_key: 'course_interest', field_label: 'Course / Program Interest', field_type: 'text', options: [], is_required: false },
    { field_key: 'education_level', field_label: 'Education Level', field_type: 'dropdown', options: ['School (K-12)', 'Undergraduate', 'Postgraduate', 'Diploma', 'Professional Certificate', 'PhD'], is_required: false },
    { field_key: 'student_age', field_label: 'Student Age', field_type: 'number', options: [], is_required: false },
    { field_key: 'preferred_mode', field_label: 'Preferred Mode', field_type: 'dropdown', options: ['Online', 'Offline / Campus', 'Hybrid'], is_required: false },
    { field_key: 'admission_year', field_label: 'Target Admission Year', field_type: 'text', options: [], is_required: false },
    { field_key: 'scholarship_required', field_label: 'Scholarship / Loan Required', field_type: 'boolean', options: [], is_required: false },
    { field_key: 'previous_score', field_label: 'Previous Exam Score / %', field_type: 'text', options: [], is_required: false },
  ],

  'Financial Services': [
    { field_key: 'service_type', field_label: 'Service Type', field_type: 'dropdown', options: ['Home Loan', 'Personal Loan', 'Business Loan', 'Insurance', 'Mutual Funds', 'Tax Filing', 'Accounting'], is_required: false },
    { field_key: 'loan_amount', field_label: 'Loan Amount Required (₹)', field_type: 'number', options: [], is_required: false },
    { field_key: 'monthly_income', field_label: 'Monthly Income (₹)', field_type: 'number', options: [], is_required: false },
    { field_key: 'credit_score', field_label: 'CIBIL / Credit Score', field_type: 'number', options: [], is_required: false },
    { field_key: 'existing_loans', field_label: 'Existing Loans', field_type: 'boolean', options: [], is_required: false },
    { field_key: 'collateral_available', field_label: 'Collateral Available', field_type: 'boolean', options: [], is_required: false },
    { field_key: 'risk_appetite', field_label: 'Risk Appetite', field_type: 'dropdown', options: ['Low', 'Medium', 'High'], is_required: false },
  ],

  'Retail / E-commerce': [
    { field_key: 'product_category', field_label: 'Product Category', field_type: 'text', options: [], is_required: false },
    { field_key: 'order_value', field_label: 'Average Order Value (₹)', field_type: 'number', options: [], is_required: false },
    { field_key: 'purchase_channel', field_label: 'Purchase Channel', field_type: 'dropdown', options: ['Online Store', 'Physical Store', 'Marketplace (Amazon/Flipkart)', 'WhatsApp Commerce'], is_required: false },
    { field_key: 'loyalty_tier', field_label: 'Loyalty Tier', field_type: 'dropdown', options: ['Bronze', 'Silver', 'Gold', 'Platinum'], is_required: false },
    { field_key: 'preferred_payment', field_label: 'Preferred Payment Method', field_type: 'dropdown', options: ['UPI', 'Credit Card', 'Debit Card', 'EMI', 'COD'], is_required: false },
    { field_key: 'return_customer', field_label: 'Returning Customer', field_type: 'boolean', options: [], is_required: false },
  ],
};

/**
 * Get suggestions for a given sector name
 * @param {string} sector
 * @returns {Array} list of field suggestion objects
 */
export function getSuggestionsForSector(sector) {
  if (!sector) return [];
  // Try exact match first, then case-insensitive
  if (SECTOR_FIELD_SUGGESTIONS[sector]) return SECTOR_FIELD_SUGGESTIONS[sector];
  const key = Object.keys(SECTOR_FIELD_SUGGESTIONS).find(
    (k) => k.toLowerCase() === sector.toLowerCase()
  );
  return key ? SECTOR_FIELD_SUGGESTIONS[key] : [];
}

/**
 * Returns all available sector names
 */
export function getAllSectorNames() {
  return Object.keys(SECTOR_FIELD_SUGGESTIONS);
}
