import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CustomFieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});

const AttachmentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileData: {
    type: String, // Stored as Base64 string for complete standalone portability
    required: true,
  },
  fileType: {
    type: String,
    default: '',
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  uploadedBy: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const LeadSchema = new mongoose.Schema(
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
      required: false,
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
    whatsappContacted: {
      type: Boolean,
      default: false,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    // Address & Zonal Localization
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
    // Business Classification
    industry: {
      type: String,
      trim: true,
      default: '',
    },
    employeeCount: {
      type: Number,
      default: 0,
    },
    annualRevenue: {
      type: Number,
      default: 0,
    },
    // Sales Priority & Statuses
    priority: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold'],
      default: 'Warm',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Lost', 'Attempted', 'Future'],
      default: 'New',
    },
    lostReason: {
      type: String,
      enum: ['Budget issue', 'No response', 'Competitor', 'Not interested', 'Other', ''],
      default: '',
    },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other', 'LinkedIn', 'Google Search', 'Event'],
      default: 'Website',
    },
    requirements: {
      type: String,
      trim: true,
      default: '',
    },
    interestedProduct: {
      type: String,
      trim: true,
      default: '',
    },
    followUpType: {
      type: String,
      enum: ['Call', 'Meeting', 'Demo', 'WhatsApp', 'Email', 'None', ''],
      default: 'None',
    },
    // Next Follow-up Tracker
    nextFollowUpDate: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null means unassigned lead
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdByRole: {
      type: String,
      default: 'sales_rep',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
    },
    customFields: [CustomFieldSchema],
    notes: [NoteSchema],
    attachments: [AttachmentSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
