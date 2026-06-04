const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Member, Role, Tenant } = require('../models');

const router = express.Router();

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find member
    const member = await Member.findOne({
      where: { username },
      include: [
        { model: Tenant, as: 'tenant' },
        { model: Role, as: 'role' },
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'name', 'display_name'],
          through: { attributes: [] }
        }
      ]
    });

    if (!member) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Validate password
    const isValidPassword = await member.validatePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if member is active
    if (!member.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Update last login
    await member.update({ last_login: new Date() });

    const resolvedRoleName =
      member.role?.name ||
      (member.roles && member.roles.length > 0 ? member.roles[0].name : null) ||
      'member';

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: member.id,
        username: member.username,
        role: resolvedRoleName,
        tenantId: member.tenant_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: member.id,
          username: member.username,
          email: member.email,
          first_name: member.name,
          last_name: member.lastname,
          role: resolvedRoleName,
          tenant_id: member.tenant_id
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, first_name, last_name, tenant_id } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      tenant_id: tenant_id || null
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: ['tenant']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;
