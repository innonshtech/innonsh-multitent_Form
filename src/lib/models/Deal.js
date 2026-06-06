import mongoose from 'mongoose';

const DealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Deal title is required'],
      trim: true,
    },
    value: {
      type: Number,
      required: [true, 'Deal value is required'],
      min: [0, 'Value cannot be negative'],
    },
    stage: {
      type: String,
      enum: ['Prospecting', 'Proposal', 'Negotiation', 'Won', 'Lost'],
      default: 'Prospecting',
    },
    closingDate: {
      type: Date,
      required: [true, 'Estimated closing date is required'],
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientOrganization',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Deal || mongoose.model('Deal', DealSchema);
