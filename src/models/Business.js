/**
 * Business Model
 * Represents a business within an organization or brand
 */

import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
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
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  industry: {
    type: String,
    required: true,
    enum: [
      'restaurant', 'hotel', 'retail', 'healthcare', 'education', 
      'fitness', 'beauty', 'automotive', 'real_estate', 'other'
    ]
  },
  businessType: {
    type: String,
    enum: ['single_location', 'multi_location', 'franchise', 'chain'],
    default: 'single_location'
  },
  contact: {
    email: {
      type: String,
      required: true
    },
    phone: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        }
      }
    }
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: false
      }
    },
    features: {
      customForms: {
        type: Boolean,
        default: false
      },
      customReports: {
        type: Boolean,
        default: false
      },
      aiInsights: {
        type: Boolean,
        default: false
      },
      integrations: {
        type: Boolean,
        default: false
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'trial'],
      default: 'trial'
    },
    trialEndsAt: Date,
    features: [String],
    limits: {
      franchises: {
        type: Number,
        default: 1
      },
      forms: {
        type: Number,
        default: 5
      },
      submissions: {
        type: Number,
        default: 100
      },
      staff: {
        type: Number,
        default: 5
      },
      storage: {
        type: Number,
        default: 1024 // MB
      }
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
businessSchema.index({ organizationId: 1 });
businessSchema.index({ brandId: 1 });
businessSchema.index({ ownerId: 1 });
businessSchema.index({ isActive: 1 });
businessSchema.index({ 'contact.address.coordinates': '2dsphere' });

// Virtual for franchise count
businessSchema.virtual('franchiseCount', {
  ref: 'Franchise',
  localField: '_id',
  foreignField: 'businessId',
  count: true
});

// Virtual for staff count
businessSchema.virtual('staffCount', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'businessId',
  count: true
});

// Pre-save middleware
businessSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
businessSchema.methods.getActiveFranchises = function() {
  return this.model('Franchise').find({ 
    businessId: this._id, 
    isActive: true 
  });
};

businessSchema.methods.getActiveStaff = function() {
  return this.model('Staff').find({ 
    businessId: this._id, 
    isActive: true 
  });
};

businessSchema.methods.checkLimit = function(limitType) {
  const limit = this.subscription.limits[limitType];
  if (limit === null) return true; // Unlimited
  
  switch (limitType) {
    case 'franchises':
      return this.franchiseCount < limit;
    case 'staff':
      return this.staffCount < limit;
    default:
      return true;
  }
};

export default mongoose.model('Business', businessSchema);
