/**
 * TRON Network Routes
 * - TRX balance and transactions
 * - TRC20 token management
 * - TRC10 token support
 * - Smart contract interactions
 */

const express = require('express');
const router = express.Router();
const TronWeb = require('tronweb');

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: 'https://api.tronstack.com',
  privateKey: process.env.TRON_PRIVATE_KEY || '',
  headers: { 'User-Agent': '3Web-Platform/1.0' }
});

const DEFAULT_WALLET = 'TDLny8udzvBLDF5Ma743zxw22drta8WD9r'; // Provided wallet

// GET /api/tron/balance/:address
router.get('/balance/:address', async (req, res) => {
  try {
    const address = req.params.address || DEFAULT_WALLET;

    if (!tronWeb.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TRON address'
      });
    }

    // Get TRX balance
    const balance = await tronWeb.trx.getBalance(address);
    const balanceInSun = balance; // Balance is in Sun (1 TRX = 1,000,000 Sun)
    const balanceInTRX = tronWeb.fromSun(balance);

    res.json({
      success: true,
      address,
      network: 'TRON',
      balance: {
        sun: balanceInSun,
        trx: parseFloat(balanceInTRX)
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/tron/token-balance/:address/:tokenAddress
router.get('/token-balance/:address/:tokenAddress', async (req, res) => {
  try {
    const { address, tokenAddress } = req.params;
    const ownerAddress = address || DEFAULT_WALLET;

    if (!tronWeb.isAddress(ownerAddress) || !tronWeb.isAddress(tokenAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TRON address format'
      });
    }

    // Get TRC20 token balance
    const contract = await tronWeb.contract().at(tokenAddress);
    const balance = await contract.balanceOf(ownerAddress).call();
    const decimals = await contract.decimals().call();
    const symbol = await contract.symbol().call();
    const name = await contract.name().call();

    const balanceValue = balance / Math.pow(10, decimals);

    res.json({
      success: true,
      address: ownerAddress,
      token: {
        address: tokenAddress,
        name: name.toString(),
        symbol: symbol.toString(),
        decimals: decimals.toNumber()
      },
      balance: {
        raw: balance.toString(),
        formatted: balanceValue
      },
      network: 'TRON',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/tron/send-trx
router.post('/send-trx', async (req, res) => {
  try {
    const { toAddress, amount, fromAddress } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'toAddress and amount are required'
      });
    }

    if (!tronWeb.isAddress(toAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address'
      });
    }

    // Send TRX transaction
    const tx = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      tronWeb.toSun(amount),
      fromAddress || DEFAULT_WALLET
    );

    const signedTx = await tronWeb.trx.sign(tx);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    res.json({
      success: true,
      message: 'TRX transaction sent successfully',
      transactionHash: result.txid,
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
});

// POST /api/tron/send-token
router.post('/send-token', async (req, res) => {
  try {
    const { toAddress, tokenAddress, amount, fromAddress } = req.body;

    if (!toAddress || !tokenAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'toAddress, tokenAddress, and amount are required'
      });
    }

    if (!tronWeb.isAddress(toAddress) || !tronWeb.isAddress(tokenAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    // Send TRC20 token
    const contract = await tronWeb.contract().at(tokenAddress);
    const decimals = await contract.decimals().call();
    const tokenAmount = amount * Math.pow(10, decimals);

    const tx = await contract.transfer(toAddress, tokenAmount).send();

    res.json({
      success: true,
      message: 'Token transfer sent successfully',
      transactionHash: tx,
      amount,
      to: toAddress,
      token: tokenAddress,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/tron/transaction/:txHash
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    const tx = await tronWeb.trx.getTransaction(txHash);
    const txInfo = await tronWeb.trx.getTransactionInfo(txHash);

    res.json({
      success: true,
      transaction: {
        hash: txHash,
        blockNumber: txInfo.blockNumber,
        blockTimestamp: new Date(txInfo.blockTimeStamp),
        contractResult: txInfo.contractResult,
        fee: txInfo.fee ? tronWeb.fromSun(txInfo.fee) : 0,
        confirmed: txInfo.receipt?.result === 'SUCCESS'
      },
      network: 'TRON',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/tron/network-info
router.get('/network-info', async (req, res) => {
  try {
    const nodeInfo = await tronWeb.trx.getNodeInfo();
    const chainParameters = await tronWeb.trx.getChainParameters();

    res.json({
      success: true,
      network: 'TRON',
      nodeInfo: {
        version: nodeInfo.configNodeInfo.codeVersion,
        totalTransactionCount: nodeInfo.configNodeInfo.totalTransactionCount
      },
      chainParameters: {
        chainId: chainParameters.chainId,
        createAccountFee: tronWeb.fromSun(chainParameters.createAccountFee)
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
