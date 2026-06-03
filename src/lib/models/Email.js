import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Email body is required'],
    },
    // Optional relations
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    opensCount: {
      type: Number,
      default: 0,
    },
    openedAt: [
      {
        type: Date,
      },
    ],
    downloadsCount: {
      type: Number,
      default: 0,
    },
    downloadedAt: [
      {
        type: Date,
      },
    ],
    replied: {
      type: Boolean,
      default: false,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    replyBody: {
      type: String,
      default: '',
    },
    proposalFile: {
      type: String,
      default: '',
    },
    proposalFileData: {
      type: String,
      default: '',
    },
    proposalFileMimeType: {
      type: String,
      default: '',
    },
    channel: {
      type: String,
      enum: ['email', 'whatsapp', 'both'],
      default: 'email',
    },
    cc: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Add index for fast querying of emails by lead or contact
EmailSchema.index({ leadId: 1, createdAt: -1 });
EmailSchema.index({ contactId: 1, createdAt: -1 });
EmailSchema.index({ sentBy: 1, createdAt: -1 });

export default mongoose.models.Email || mongoose.model('Email', EmailSchema);
