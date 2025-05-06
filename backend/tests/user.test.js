const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { db, initDatabase } = require('../database');
const userRoutes = require('./routes/userRoutes');

// Mock JWT secret
process.env.JWT_SECRET = 'test_secret_key';

describe('User API', () => {
  let app;
  
  beforeAll(async () => {
    // Initialize in-memory SQLite database for testing
    await initDatabase();
    
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
    
    // Create test admin user
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    await db.run(
      'INSERT INTO users (email, username, password, is_admin) VALUES (?, ?, ?, ?)',
      ['test@example.com', 'testuser', hashedPassword, 1]
    );
  });
  
  afterAll(async () => {
    // Close database connection
    await new Promise((resolve) => {
      db.close(resolve);
    });
  });
  
  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          login: 'testuser',
          password: 'testpassword'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('username', 'testuser');
    });
    
    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          login: 'testuser',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});