/**
 * Asset Controller
 * Handles all asset operations
 */

const Asset = require('../models/Asset');
const TronWeb = require('tronweb');

const tronWeb = new TronWeb({
  fullHost: 'https://api.tronstack.com',
  privateKey: process.env.TRON_PRIVATE_KEY || '',
  headers: { 'User-Agent': '3Web-Platform/1.0' }
});

// Get all user assets
exports.getAllAssets = async (req, res) => {
  try {
    const { userId } = req.user;
    const assets = await Asset.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      assets: assets,
      count: assets.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get single asset
exports.getAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    res.json({
      success: true,
      asset,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Add new asset
exports.addAsset = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, type, contractAddress, ownerAddress, symbol, decimals } = req.body;

    if (!name || !type || !contractAddress || !ownerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify contract exists on TRON
    const contract = await tronWeb.trx.getAccount(tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY));

    const asset = new Asset({
      userId,
      name,
      type,
      contractAddress,
      ownerAddress,
      symbol,
      decimals,
      tronscanUrl: `https://tronscan.org/#/contract/${contractAddress}`
    });

    await asset.save();

    res.status(201).json({
      success: true,
      message: 'Asset added successfully',
      asset,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Update asset
exports.updateAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const updates = req.body;

    const asset = await Asset.findByIdAndUpdate(
      assetId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    res.json({
      success: true,
      message: 'Asset updated successfully',
      asset,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Delete asset
exports.deleteAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const asset = await Asset.findByIdAndDelete(assetId);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    res.json({
      success: true,
      message: 'Asset deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get asset balance
exports.getAssetBalance = async (req, res) => {
  try {
    const { contractAddress, ownerAddress } = req.params;

    if (!tronWeb.isAddress(ownerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TRON address'
      });
    }

    const contract = await tronWeb.contract().at(contractAddress);
    const balance = await contract.balanceOf(ownerAddress).call();
    const decimals = await contract.decimals().call();
    const symbol = await contract.symbol().call();

    const balanceValue = balance / Math.pow(10, decimals);

    res.json({
      success: true,
      balance: {
        raw: balance.toString(),
        formatted: balanceValue,
        symbol: symbol.toString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Mint tokens
exports.mintTokens = async (req, res) => {
  try {
    const { contractAddress, toAddress, amount, decimals } = req.body;

    if (!contractAddress || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const contract = await tronWeb.contract().at(contractAddress);
    const mintAmount = amount * Math.pow(10, decimals || 18);

    const tx = await contract.mint(toAddress, mintAmount).send();

    res.json({
      success: true,
      message: 'Tokens minted successfully',
      transactionHash: tx,
      amount,
      to: toAddress,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Burn tokens
exports.burnTokens = async (req, res) => {
  try {
    const { contractAddress, amount, decimals } = req.body;

    if (!contractAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const contract = await tronWeb.contract().at(contractAddress);
    const burnAmount = amount * Math.pow(10, decimals || 18);

    const tx = await contract.burn(burnAmount).send();

    res.json({
      success: true,
      message: 'Tokens burned successfully',
      transactionHash: tx,
      amount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Freeze account
exports.freezeAccount = async (req, res) => {
  try {
    const { contractAddress, toAddress, amount } = req.body;

    if (!contractAddress || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const contract = await tronWeb.contract().at(contractAddress);
    const tx = await contract.freeze(toAddress, tronWeb.toSun(amount)).send();

    res.json({
      success: true,
      message: 'Account frozen successfully',
      transactionHash: tx,
      frozenAddress: toAddress,
      amount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get asset transactions
exports.getAssetTransactions = async (req, res) => {
  try {
    const { assetId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    const transactions = asset.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: asset.transactions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
