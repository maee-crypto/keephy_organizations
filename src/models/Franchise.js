/**
 * Franchise Model
 * Represents a franchise/location within a business
 */

import mongoose from 'mongoose';

const franchiseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    operatingHours: {
      monday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false }
      },
      tuesday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false }
      },
      wednesday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false }
      },
      thursday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false }
      },
      friday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false }
      },
      saturday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false }
      },
      sunday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false }
      }
    },
    features: {
      wifi: {
        type: Boolean,
        default: false
      },
      parking: {
        type: Boolean,
        default: false
      },
      delivery: {
        type: Boolean,
        default: false
      },
      takeout: {
        type: Boolean,
        default: false
      },
      outdoorSeating: {
        type: Boolean,
        default: false
      }
    }
  },
  capacity: {
    maxCustomers: {
      type: Number,
      default: 50
    },
    seatingCapacity: {
      type: Number,
      default: 30
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
franchiseSchema.index({ businessId: 1 });
franchiseSchema.index({ managerId: 1 });
franchiseSchema.index({ isActive: 1 });
franchiseSchema.index({ 'address.coordinates': '2dsphere' });

// Virtual for staff count
franchiseSchema.virtual('staffCount', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'franchiseId',
  count: true
});

// Virtual for form count
franchiseSchema.virtual('formCount', {
  ref: 'Form',
  localField: '_id',
  foreignField: 'franchiseId',
  count: true
});

// Pre-save middleware
franchiseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
franchiseSchema.methods.getActiveStaff = function() {
  return this.model('Staff').find({ 
    franchiseId: this._id, 
    isActive: true 
  });
};

franchiseSchema.methods.getActiveForms = function() {
  return this.model('Form').find({ 
    franchiseId: this._id, 
    isActive: true 
  });
};

franchiseSchema.methods.isOpen = function(date = new Date()) {
  const day = date.toLocaleLowerCase().substring(0, 3);
  const daySettings = this.settings.operatingHours[day];
  
  if (daySettings.closed) return false;
  
  const currentTime = date.toTimeString().substring(0, 5);
  return currentTime >= daySettings.open && currentTime <= daySettings.close;
};

export default mongoose.model('Franchise', franchiseSchema);
