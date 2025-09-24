const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  model: jest.fn(),
  Schema: jest.fn(() => ({})),
}));

// Create test app
const express = require('express');
const app = express();
app.use(express.json());

// Mock Organization model
const mockOrganization = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Organization',
  type: 'enterprise',
  status: 'active',
  settings: {
    timezone: 'UTC',
    currency: 'USD',
    language: 'en'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const Organization = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

mongoose.model.mockReturnValue(Organization);

// Mock middleware
const mockAuth = (req, res, next) => {
  req.user = {
    id: '507f1f77bcf86cd799439011',
    roles: ['admin'],
    scopes: { orgId: '507f1f77bcf86cd799439011' }
  };
  next();
};

// Organization routes
app.get('/organizations', mockAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = { name: { $regex: search, $options: 'i' } };
    }

    const organizations = await Organization.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Organization.countDocuments(query);

    res.json({
      organizations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/organizations/:id', mockAuth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id).lean();
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/organizations', mockAuth, async (req, res) => {
  try {
    const { name, type, settings } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const organization = {
      _id: '507f1f77bcf86cd799439012',
      name,
      type,
      status: 'active',
      settings: settings || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Organization.create.mockResolvedValue(organization);

    res.status(201).json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/organizations/:id', mockAuth, async (req, res) => {
  try {
    const { name, type, settings, status } = req.body;
    
    const updateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (settings) updateData.settings = settings;
    if (status) updateData.status = status;

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).lean();

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/organizations/:id', mockAuth, async (req, res) => {
  try {
    const organization = await Organization.findByIdAndDelete(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

describe('Organizations Service API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /organizations', () => {
    it('should get all organizations with pagination', async () => {
      Organization.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockOrganization])
      });
      Organization.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/organizations')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.organizations).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should search organizations by name', async () => {
      Organization.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockOrganization])
      });
      Organization.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/organizations')
        .query({ search: 'Test' });

      expect(response.status).toBe(200);
      expect(Organization.find).toHaveBeenCalledWith({
        name: { $regex: 'Test', $options: 'i' }
      });
    });

    it('should handle server errors', async () => {
      Organization.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app).get('/organizations');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /organizations/:id', () => {
    it('should get organization by id', async () => {
      Organization.findById.mockResolvedValue(mockOrganization);

      const response = await request(app)
        .get('/organizations/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(mockOrganization._id);
    });

    it('should return 404 for non-existent organization', async () => {
      Organization.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/organizations/507f1f77bcf86cd799439999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Organization not found');
    });
  });

  describe('POST /organizations', () => {
    it('should create new organization', async () => {
      const newOrg = {
        _id: '507f1f77bcf86cd799439012',
        name: 'New Organization',
        type: 'enterprise',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Organization.create.mockResolvedValue(newOrg);

      const response = await request(app)
        .post('/organizations')
        .send({
          name: 'New Organization',
          type: 'enterprise',
          settings: { timezone: 'UTC' }
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Organization');
    });

    it('should require name and type', async () => {
      const response = await request(app)
        .post('/organizations')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Name and type are required');
    });
  });

  describe('PUT /organizations/:id', () => {
    it('should update organization', async () => {
      const updatedOrg = { ...mockOrganization, name: 'Updated Organization' };
      Organization.findByIdAndUpdate.mockResolvedValue(updatedOrg);

      const response = await request(app)
        .put('/organizations/507f1f77bcf86cd799439011')
        .send({ name: 'Updated Organization' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Organization');
    });

    it('should return 404 for non-existent organization', async () => {
      Organization.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/organizations/507f1f77bcf86cd799439999')
        .send({ name: 'Updated Organization' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Organization not found');
    });
  });

  describe('DELETE /organizations/:id', () => {
    it('should delete organization', async () => {
      Organization.findByIdAndDelete.mockResolvedValue(mockOrganization);

      const response = await request(app)
        .delete('/organizations/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Organization deleted successfully');
    });

    it('should return 404 for non-existent organization', async () => {
      Organization.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete('/organizations/507f1f77bcf86cd799439999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Organization not found');
    });
  });
});
