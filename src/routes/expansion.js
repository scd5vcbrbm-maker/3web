const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/expansion/create-branch
 * Create a new organization/business branch
 */
router.post('/create-branch', async (req, res) => {
  try {
    const { branchName, branchType, location, settings } = req.body;
    const userId = req.userId;

    if (!branchName || !branchType) {
      return res.status(400).json({
        status: 'error',
        message: 'branchName and branchType are required',
        code: 'INVALID_INPUT'
      });
    }

    const supportedTypes = ['subsidiary', 'trading_desk', 'fund', 'dao', 'partnership'];

    if (!supportedTypes.includes(branchType)) {
      return res.status(400).json({
        status: 'error',
        message: `Branch type not supported. Supported: ${supportedTypes.join(', ')}`,
        code: 'INVALID_TYPE'
      });
    }

    const branch = {
      id: `branch_${uuidv4()}`,
      parentUserId: userId,
      branchName,
      branchType,
      location,
      status: 'active',
      apiKey: `bk_${uuidv4()}`,
      walletAllocation: '0 ETH',
      transactionLimit: 'unlimited',
      settings,
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info(`Branch created: ${branchName} (${branchType})`);

    res.status(201).json({
      status: 'success',
      data: branch,
      message: 'Branch created successfully'
    });
  } catch (error) {
    logger.error(`Branch creation error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Branch creation failed',
      code: 'EXPANSION_ERROR'
    });
  }
});

/**
 * GET /api/expansion/branches
 * List all branches
 */
router.get('/branches', async (req, res) => {
  try {
    const branches = [
      {
        id: 'branch_1',
        branchName: 'Asia Trading Desk',
        branchType: 'trading_desk',
        location: 'Singapore',
        status: 'active',
        walletCount: 12,
        totalVolume: '2.5M',
        created_at: new Date().toISOString()
      },
      {
        id: 'branch_2',
        branchName: 'European Fund',
        branchType: 'fund',
        location: 'Switzerland',
        status: 'active',
        walletCount: 8,
        totalVolume: '4.2M',
        created_at: new Date().toISOString()
      },
      {
        id: 'branch_3',
        branchName: 'DAO Treasury',
        branchType: 'dao',
        location: 'Decentralized',
        status: 'active',
        walletCount: 25,
        totalVolume: '15.8M',
        created_at: new Date().toISOString()
      }
    ];

    res.status(200).json({
      status: 'success',
      data: branches,
      total: branches.length,
      message: 'Branches retrieved'
    });
  } catch (error) {
    logger.error(`Branches fetch error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch branches',
      code: 'EXPANSION_ERROR'
    });
  }
});

/**
 * POST /api/expansion/add-team-member
 * Add team member to branch
 */
router.post('/add-team-member', async (req, res) => {
  try {
    const { branchId, email, role, permissions } = req.body;

    if (!branchId || !email || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'branchId, email, and role are required',
        code: 'INVALID_INPUT'
      });
    }

    const supportedRoles = ['admin', 'manager', 'trader', 'viewer', 'analyst'];

    if (!supportedRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Role not supported. Supported: ${supportedRoles.join(', ')}`,
        code: 'INVALID_ROLE'
      });
    }

    const member = {
      id: `member_${uuidv4()}`,
      branchId,
      email,
      role,
      permissions: permissions || ['read'],
      status: 'invited',
      joinedAt: null,
      createdAt: new Date().toISOString()
    };

    logger.info(`Team member added: ${email} to branch ${branchId}`);

    res.status(201).json({
      status: 'success',
      data: member,
      message: 'Team member added successfully'
    });
  } catch (error) {
    logger.error(`Team member error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add team member',
      code: 'TEAM_ERROR'
    });
  }
});

/**
 * POST /api/expansion/api-keys
 * Generate API keys for branch integration
 */
router.post('/api-keys', async (req, res) => {
  try {
    const { branchId, name, scopes = ['read', 'write'] } = req.body;

    if (!branchId) {
      return res.status(400).json({
        status: 'error',
        message: 'branchId is required',
        code: 'INVALID_INPUT'
      });
    }

    const apiKey = {
      id: `key_${uuidv4()}`,
      branchId,
      name: name || `API Key ${Date.now()}`,
      key: `sk_live_${uuidv4().replace(/-/g, '').substring(0, 32)}`,
      secret: '[ENCRYPTED]',
      scopes,
      status: 'active',
      lastUsed: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    logger.info(`API key generated for branch: ${branchId}`);

    res.status(201).json({
      status: 'success',
      data: apiKey,
      message: 'API key generated successfully'
    });
  } catch (error) {
    logger.error(`API key error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate API key',
      code: 'KEY_ERROR'
    });
  }
});

/**
 * GET /api/expansion/analytics
 * Get expansion analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const analytics = {
      totalBranches: 3,
      totalTeamMembers: 18,
      totalWallets: 45,
      totalVolume24h: '22.5M',
      totalVolume30d: '450.2M',
      branchPerformance: [
        {
          branchId: 'branch_1',
          name: 'Asia Trading Desk',
          volume24h: '2.5M',
          volume30d: '45.2M',
          profitability: '12.5%',
          status: 'active'
        },
        {
          branchId: 'branch_2',
          name: 'European Fund',
          volume24h: '4.2M',
          volume30d: '89.5M',
          profitability: '18.2%',
          status: 'active'
        },
        {
          branchId: 'branch_3',
          name: 'DAO Treasury',
          volume24h: '15.8M',
          volume30d: '315.5M',
          profitability: '25.1%',
          status: 'active'
        }
      ],
      teamMetrics: {
        activeMembers: 18,
        roleDistribution: {
          admin: 3,
          manager: 5,
          trader: 7,
          analyst: 3
        },
        onboardedThisMonth: 4
      }
    };

    res.status(200).json({
      status: 'success',
      data: analytics,
      message: 'Expansion analytics retrieved'
    });
  } catch (error) {
    logger.error(`Analytics error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics',
      code: 'ANALYTICS_ERROR'
    });
  }
});

module.exports = router;
