/**
 * Organization Model
 * Represents the top-level organizational structure
 */

import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
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
  domain: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,
    default: null
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
    features: {
      multiBrand: {
        type: Boolean,
        default: false
      },
      whiteLabel: {
        type: Boolean,
        default: false
      },
      customDomain: {
        type: Boolean,
        default: false
      }
    }
  },
  contact: {
    email: {
      type: String,
      required: true
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
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
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    }
  },
  limits: {
    brands: {
      type: Number,
      default: 1
    },
    businesses: {
      type: Number,
      default: 5
    },
    users: {
      type: Number,
      default: 10
    },
    storage: {
      type: Number,
      default: 1024 // MB
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
organizationSchema.index({ domain: 1 });
organizationSchema.index({ 'contact.email': 1 });
organizationSchema.index({ isActive: 1 });

// Virtual for brand count
organizationSchema.virtual('brandCount', {
  ref: 'Brand',
  localField: '_id',
  foreignField: 'organizationId',
  count: true
});

// Virtual for business count
organizationSchema.virtual('businessCount', {
  ref: 'Business',
  localField: '_id',
  foreignField: 'organizationId',
  count: true
});

// Pre-save middleware
organizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
organizationSchema.methods.getActiveBrands = function() {
  return this.model('Brand').find({ 
    organizationId: this._id, 
    isActive: true 
  });
};

organizationSchema.methods.getActiveBusinesses = function() {
  return this.model('Business').find({ 
    organizationId: this._id, 
    isActive: true 
  });
};

organizationSchema.methods.checkLimit = function(limitType) {
  const limit = this.limits[limitType];
  if (limit === null) return true; // Unlimited
  
  switch (limitType) {
    case 'brands':
      return this.brandCount < limit;
    case 'businesses':
      return this.businessCount < limit;
    default:
      return true;
  }
};

export default mongoose.model('Organization', organizationSchema);
