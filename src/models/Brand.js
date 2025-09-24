/**
 * Brand Model
 * Represents a brand within an organization
 */

import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  logo: {
    type: String,
    default: null
  },
  brandGuidelines: {
    primaryColor: String,
    secondaryColor: String,
    fontFamily: String,
    logoVariations: [String]
  },
  settings: {
    theme: {
      type: String,
      default: 'default'
    },
    customDomain: String,
    features: {
      customForms: {
        type: Boolean,
        default: false
      },
      customReports: {
        type: Boolean,
        default: false
      },
      whiteLabel: {
        type: Boolean,
        default: false
      }
    }
  },
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  limits: {
    businesses: {
      type: Number,
      default: 10
    },
    users: {
      type: Number,
      default: 50
    },
    forms: {
      type: Number,
      default: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
brandSchema.index({ organizationId: 1 });
brandSchema.index({ name: 1 });
brandSchema.index({ isActive: 1 });

// Virtual for business count
brandSchema.virtual('businessCount', {
  ref: 'Business',
  localField: '_id',
  foreignField: 'brandId',
  count: true
});

// Pre-save middleware
brandSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
brandSchema.methods.getActiveBusinesses = function() {
  return this.model('Business').find({ 
    brandId: this._id, 
    isActive: true 
  });
};

brandSchema.methods.checkLimit = function(limitType) {
  const limit = this.limits[limitType];
  if (limit === null) return true; // Unlimited
  
  switch (limitType) {
    case 'businesses':
      return this.businessCount < limit;
    default:
      return true;
  }
};

export default mongoose.model('Brand', brandSchema);
