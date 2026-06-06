import mongoose from 'mongoose';

const ClientOrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Client organization name is required'],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'SaaS organization ID is required'],
    },
    customData: {
      type: mongoose.Schema.Types.Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Search Index
ClientOrganizationSchema.index({ name: 'text', website: 'text' });

export default mongoose.models.ClientOrganization || mongoose.model('ClientOrganization', ClientOrganizationSchema);
