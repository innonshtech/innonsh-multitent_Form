import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    whatsapp: {
      type: String,
      trim: true,
      default: '',
    },
    // Location Details
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    // Relations & Attribution
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Assigned manager/sales rep
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null, // Tracks if this Contact was converted from a specific Lead
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientOrganization',
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for powerful multi-field search (First Name, Last Name, Company, Email, Phone)
ContactSchema.index({ firstName: 'text', lastName: 'text', company: 'text', email: 'text', phone: 'text' });

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
