#!/usr/bin/env node

/**
 * Keephy Organizations Service
 * Manages organizations, brands, businesses, and franchises
 */

import express from 'express';
import mongoose from 'mongoose';
import pino from 'pino';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

// Import models
import Organization from './models/Organization.js';
import Brand from './models/Brand.js';
import Business from './models/Business.js';
import Franchise from './models/Franchise.js';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '10mb' }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/keephy_enhanced';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'keephy_organizations',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready', service: 'keephy_organizations' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// =============================================================================
// ORGANIZATION ROUTES
// =============================================================================

// Get all organizations
app.get('/api/organizations', async (req, res) => {
  try {
    const { isActive, limit = 50, offset = 0 } = req.query;
    
    let filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const organizations = await Organization.find(filter)
      .populate('brandCount')
      .populate('businessCount')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: organizations,
      count: organizations.length
    });
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations'
    });
  }
});

// Get organization by ID
app.get('/api/organizations/:id', async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('brandCount')
      .populate('businessCount');
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    logger.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization'
    });
  }
});

// Create organization
app.post('/api/organizations', async (req, res) => {
  try {
    const organization = new Organization(req.body);
    await organization.save();
    
    res.status(201).json({
      success: true,
      data: organization
    });
  } catch (error) {
    logger.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create organization'
    });
  }
});

// Update organization
app.put('/api/organizations/:id', async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    logger.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organization'
    });
  }
});

// =============================================================================
// BRAND ROUTES
// =============================================================================

// Get brands by organization
app.get('/api/organizations/:orgId/brands', async (req, res) => {
  try {
    const brands = await Brand.find({ 
      organizationId: req.params.orgId,
      isActive: true 
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: brands,
      count: brands.length
    });
  } catch (error) {
    logger.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands'
    });
  }
});

// Create brand
app.post('/api/brands', async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    
    res.status(201).json({
      success: true,
      data: brand
    });
  } catch (error) {
    logger.error('Error creating brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create brand'
    });
  }
});

// =============================================================================
// BUSINESS ROUTES
// =============================================================================

// Get businesses by organization
app.get('/api/organizations/:orgId/businesses', async (req, res) => {
  try {
    const { brandId, isActive, limit = 50, offset = 0 } = req.query;
    
    let filter = { organizationId: req.params.orgId };
    if (brandId) filter.brandId = brandId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const businesses = await Business.find(filter)
      .populate('brandId', 'name')
      .populate('franchiseCount')
      .populate('staffCount')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: businesses,
      count: businesses.length
    });
  } catch (error) {
    logger.error('Error fetching businesses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch businesses'
    });
  }
});

// Get business by ID
app.get('/api/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('brandId', 'name')
      .populate('franchiseCount')
      .populate('staffCount');
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    logger.error('Error fetching business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business'
    });
  }
});

// Create business
app.post('/api/businesses', async (req, res) => {
  try {
    const business = new Business(req.body);
    await business.save();
    
    res.status(201).json({
      success: true,
      data: business
    });
  } catch (error) {
    logger.error('Error creating business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create business'
    });
  }
});

// Update business
app.put('/api/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    logger.error('Error updating business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business'
    });
  }
});

// =============================================================================
// FRANCHISE ROUTES
// =============================================================================

// Get franchises by business
app.get('/api/businesses/:businessId/franchises', async (req, res) => {
  try {
    const { isActive, limit = 50, offset = 0 } = req.query;
    
    let filter = { businessId: req.params.businessId };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const franchises = await Franchise.find(filter)
      .populate('managerId', 'firstName lastName email')
      .populate('staffCount')
      .populate('formCount')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: franchises,
      count: franchises.length
    });
  } catch (error) {
    logger.error('Error fetching franchises:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch franchises'
    });
  }
});

// Get franchise by ID
app.get('/api/franchises/:id', async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id)
      .populate('managerId', 'firstName lastName email')
      .populate('staffCount')
      .populate('formCount');
    
    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }
    
    res.json({
      success: true,
      data: franchise
    });
  } catch (error) {
    logger.error('Error fetching franchise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch franchise'
    });
  }
});

// Create franchise
app.post('/api/franchises', async (req, res) => {
  try {
    const franchise = new Franchise(req.body);
    await franchise.save();
    
    res.status(201).json({
      success: true,
      data: franchise
    });
  } catch (error) {
    logger.error('Error creating franchise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create franchise'
    });
  }
});

// Update franchise
app.put('/api/franchises/:id', async (req, res) => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!franchise) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found'
      });
    }
    
    res.json({
      success: true,
      data: franchise
    });
  } catch (error) {
    logger.error('Error updating franchise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update franchise'
    });
  }
});

// =============================================================================
// HIERARCHY ROUTES
// =============================================================================

// Get full hierarchy for organization
app.get('/api/organizations/:orgId/hierarchy', async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.orgId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    const brands = await Brand.find({ 
      organizationId: req.params.orgId, 
      isActive: true 
    });
    
    const businesses = await Business.find({ 
      organizationId: req.params.orgId, 
      isActive: true 
    }).populate('brandId', 'name');
    
    const franchises = await Franchise.find({ 
      businessId: { $in: businesses.map(b => b._id) },
      isActive: true 
    });
    
    res.json({
      success: true,
      data: {
        organization,
        brands,
        businesses,
        franchises
      }
    });
  } catch (error) {
    logger.error('Error fetching hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hierarchy'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Keephy Organizations Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});
