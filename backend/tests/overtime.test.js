const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { db, initDatabase } = require('../database');
const overtimeRoutes = require('../overtimeRoutes');
const calculateOvertimePay = require('../overtimeCalculator');

// Mock authentication middleware
jest.mock('../auth', () => {
  return (req, res, next) => {
    req.userId = 1; // Mock authenticated user
    next();
  };
});

describe('Overtime API', () => {
  let app;
  
  beforeAll(async () => {
    // Initialize in-memory SQLite database for testing
    await initDatabase();
    
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/overtime', overtimeRoutes);
  });
  
  afterAll(async () => {
    // Close database connection
    await new Promise((resolve) => {
      db.close(resolve);
    });
  });
  
  describe('POST /calculate', () => {
    it('should calculate overtime pay correctly', async () => {
      const response = await request(app)
        .post('/api/overtime/calculate')
        .send({
          salary: 5000,
          end_hour: 20,
          minutes: 30
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toBeGreaterThan(0);
    });
    
    it('should return error for invalid input', async () => {
      const response = await request(app)
        .post('/api/overtime/calculate')
        .send({
          salary: 5000,
          end_hour: 18, // Invalid: less than 19
          minutes: 30
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /', () => {
    it('should return overtime records for authenticated user', async () => {
      const response = await request(app).get('/api/overtime');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});