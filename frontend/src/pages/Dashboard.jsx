import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [masterKey, setMasterKey] = useState('');
  const [wallets, setWallets] = useState([]);
  const [globalMarkets, setGlobalMarkets] = useState([]);
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [connectedWallets, setConnectedWallets] = useState([]);
  const [syncedWallets, setSyncedWallets] = useState([]);

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
    headers: {
      'X-Master-Key': masterKey,
      'Content-Type': 'application/json'
    }
  });

  // Authenticate with Master Key
  const handleAuth = async () => {
    try {
      setLoading(true);
      const response = await api.post('/auth/validate', { masterKey });
      if (response.data.status === 'success') {
        localStorage.setItem('masterKey', masterKey);
        loadDashboard();
      }
    } catch (error) {
      alert('Invalid Master Key');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchWallets(),
        fetchGlobalMarkets(),
        fetchSyncStatus(),
        fetchConnectedWallets()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all wallets
  const fetchWallets = async () => {
    try {
      const response = await api.get('/wallets');
      setWallets(response.data.data);
      const total = response.data.data.reduce((sum, wallet) => {
        const usdValue = parseFloat(wallet.balanceUsd || 0);
        return sum + usdValue;
      }, 0);
      setTotalBalance(total);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  // Fetch global markets
  const fetchGlobalMarkets = async () => {
    try {
      const response = await api.get('/exchanges/market');
      setGlobalMarkets(response.data.data);
    } catch (error) {
      console.error('Error fetching markets:', error);
    }
  };

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const response = await api.get('/cloud-sync/sync-status');
      setSyncStatus(response.data.data.overallStatus);
      setSyncedWallets(response.data.data.cloudServices);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  // Fetch connected external wallets (Binance, Trust Wallet, etc.)
  const fetchConnectedWallets = async () => {
    try {
      const response = await api.get('/wallet-sync/connected');
      setConnectedWallets(response.data.data);
    } catch (error) {
      console.error('Error fetching connected wallets:', error);
    }
  };

  // Sync wallet from external source (Binance, Trust Wallet, etc.)
  const syncExternalWallet = async (walletType) => {
    try {
      setLoading(true);
      const response = await api.post('/wallet-sync/import', {
        source: walletType,
        apiKey: prompt(`Enter your ${walletType} API Key:`),
        apiSecret: prompt(`Enter your ${walletType} API Secret:`) // Only for exchanges
      });
      if (response.data.status === 'success') {
        alert(`${walletType} wallet synced successfully!`);
        await fetchConnectedWallets();
        await fetchWallets();
      }
    } catch (error) {
      alert(`Error syncing ${walletType} wallet`);
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync all wallets
  const syncAllWallets = async () => {
    try {
      setLoading(true);
      const response = await api.post('/wallet-sync/sync-all');
      if (response.data.status === 'success') {
        alert('All wallets synced!');
        await loadDashboard();
      }
    } catch (error) {
      alert('Error syncing wallets');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('masterKey');
    if (savedKey) {
      setMasterKey(savedKey);
      loadDashboard();
    }
  }, []);

  if (!masterKey) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🌐 3Web Global Dashboard</h1>
          <p>Enter your Master Key to access your global wallets and markets</p>
          <input
            type="password"
            placeholder="Enter Master Key"
            value={masterKey}
            onChange={(e) => setMasterKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
          />
          <button onClick={handleAuth} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🌐 3Web Global Dashboard</h1>
          <p>Manage all your wallets across global markets</p>
        </div>
        <div className="header-right">
          <div className="sync-status">
            <span className={`status-indicator ${syncStatus}`}></span>
            <span>Sync: {syncStatus}</span>
          </div>
          <button onClick={() => {
            localStorage.removeItem('masterKey');
            window.location.reload();
          }} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'wallets' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallets')}
        >
          💼 Wallets
        </button>
        <button
          className={`nav-tab ${activeTab === 'markets' ? 'active' : ''}`}
          onClick={() => setActiveTab('markets')}
        >
          📈 Global Markets
        </button>
        <button
          className={`nav-tab ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          🔄 Wallet Sync
        </button>
        <button
          className={`nav-tab ${activeTab === 'integration' ? 'active' : ''}`}
          onClick={() => setActiveTab('integration')}
        >
          🔗 Integrations
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Balance</h3>
                <p className="stat-value">${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                <span className="stat-label">USD</span>
              </div>
              <div className="stat-card">
                <h3>Active Wallets</h3>
                <p className="stat-value">{wallets.length}</p>
                <span className="stat-label">Connected</span>
              </div>
              <div className="stat-card">
                <h3>Synced Sources</h3>
                <p className="stat-value">{connectedWallets.length}</p>
                <span className="stat-label">External</span>
              </div>
              <div className="stat-card">
                <h3>Market Cap</h3>
                <p className="stat-value">{globalMarkets.globalMarketCap}</p>
                <span className="stat-label">Global</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>⚡ Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-btn" onClick={syncAllWallets}>
                  🔄 Sync All Wallets
                </button>
                <button className="action-btn" onClick={() => setActiveTab('sync')}>
                  🔗 Add Wallet
                </button>
                <button className="action-btn" onClick={() => setActiveTab('markets')}>
                  📊 View Markets
                </button>
                <button className="action-btn" onClick={async () => {
                  await api.post('/cloud-sync/backup');
                  alert('Backup created!');
                }}>
                  💾 Backup Now
                </button>
              </div>
            </div>

            {/* Top Gainers/Losers */}
            {globalMarkets.top24hGainers && (
              <div className="market-highlights">
                <div className="highlights-section">
                  <h4>🚀 Top Gainers (24h)</h4>
                  {globalMarkets.top24hGainers.map((gainer, idx) => (
                    <div key={idx} className="highlight-item gainers">
                      <span>{gainer.symbol}</span>
                      <span className="change">{gainer.change}</span>
                    </div>
                  ))}
                </div>
                <div className="highlights-section">
                  <h4>📉 Top Losers (24h)</h4>
                  {globalMarkets.top24hLosers.map((loser, idx) => (
                    <div key={idx} className="highlight-item losers">
                      <span>{loser.symbol}</span>
                      <span className="change">{loser.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div className="wallets-section">
            <div className="section-header">
              <h2>💼 Your Wallets</h2>
              <button className="btn-primary" onClick={() => setActiveTab('sync')}>+ Add Wallet</button>
            </div>
            <div className="wallets-grid">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="wallet-card">
                  <div className="wallet-header">
                    <h3>{wallet.type.toUpperCase()}</h3>
                    <span className={`network-badge ${wallet.network}`}>{wallet.network}</span>
                  </div>
                  <div className="wallet-address">
                    <code>{wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}</code>
                  </div>
                  <div className="wallet-balance">
                    <p className="balance">{wallet.balance}</p>
                    <p className="balance-usd">${wallet.balanceUsd}</p>
                  </div>
                  <div className="wallet-actions">
                    <button className="btn-small">Send</button>
                    <button className="btn-small">Receive</button>
                    <button className="btn-small">History</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Markets Tab */}
        {activeTab === 'markets' && (
          <div className="markets-section">
            <div className="section-header">
              <h2>📈 Global Markets</h2>
              <span className="fear-greed">
                Fear & Greed Index: {globalMarkets.fearGreedIndex}
              </span>
            </div>
            <div className="market-overview">
              <div className="market-stat">
                <h4>Global Market Cap</h4>
                <p>{globalMarkets.globalMarketCap}</p>
              </div>
              <div className="market-stat">
                <h4>Bitcoin Dominance</h4>
                <p>{globalMarkets.btcDominance}</p>
              </div>
              <div className="market-stat">
                <h4>Ethereum Dominance</h4>
                <p>{globalMarkets.ethDominance}</p>
              </div>
              <div className="market-stat">
                <h4>24h Volume</h4>
                <p>${globalMarkets.totalVolume24h}</p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Sync Tab */}
        {activeTab === 'sync' && (
          <div className="sync-section">
            <div className="section-header">
              <h2>🔄 Wallet Synchronization</h2>
              <button className="btn-primary" onClick={syncAllWallets} disabled={loading}>
                {loading ? 'Syncing...' : '🔄 Sync All'}
              </button>
            </div>

            {/* Connected Wallets */}
            <div className="connected-wallets">
              <h3>📍 Connected Wallets</h3>
              <div className="wallets-list">
                {connectedWallets.length > 0 ? (
                  connectedWallets.map((wallet) => (
                    <div key={wallet.id} className="connected-wallet-item">
                      <div className="wallet-info">
                        <h4>{wallet.source}</h4>
                        <p>Balance: {wallet.balance}</p>
                        <p>Last Sync: {new Date(wallet.lastSync).toLocaleString()}</p>
                      </div>
                      <span className={`status-badge ${wallet.status}`}>{wallet.status}</span>
                    </div>
                  ))
                ) : (
                  <p>No connected wallets yet</p>
                )}
              </div>
            </div>

            {/* Available Sources */}
            <div className="available-sources">
              <h3>🔗 Available Wallet Sources</h3>
              <p>Connect your external wallets to automatically sync balances and transactions</p>
              <div className="sources-grid">
                {[
                  { name: 'Binance', icon: '🔷', desc: 'Binance Exchange' },
                  { name: 'Trust Wallet', icon: '🛡️', desc: 'Trust Wallet Mobile' },
                  { name: 'MetaMask', icon: '🦊', desc: 'MetaMask Browser' },
                  { name: 'Coinbase', icon: '☁️', desc: 'Coinbase Exchange' },
                  { name: 'Kraken', icon: '🐙', desc: 'Kraken Exchange' },
                  { name: 'Ledger', icon: '🔐', desc: 'Ledger Hardware' },
                  { name: 'Trezor', icon: '💾', desc: 'Trezor Hardware' },
                  { name: 'Phantom', icon: '👻', desc: 'Phantom Solana' },
                  { name: 'OKEx', icon: '🎯', desc: 'OKEx Exchange' },
                  { name: 'Huobi', icon: '🌐', desc: 'Huobi Exchange' },
                  { name: 'Kucoin', icon: '⭐', desc: 'Kucoin Exchange' },
                  { name: 'Bybit', icon: '⚡', desc: 'Bybit Exchange' }
                ].map((source) => (
                  <button
                    key={source.name}
                    className="source-card"
                    onClick={() => syncExternalWallet(source.name)}
                  >
                    <span className="source-icon">{source.icon}</span>
                    <h4>{source.name}</h4>
                    <p>{source.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integration' && (
          <div className="integration-section">
            <div className="section-header">
              <h2>🔗 Wallet Integrations</h2>
              <p>Manage connected wallet services</p>
            </div>

            {/* Cloud Sync Status */}
            <div className="cloud-sync-status">
              <h3>☁️ Cloud Synchronization</h3>
              <div className="sync-providers">
                {syncedWallets.map((provider, idx) => (
                  <div key={idx} className="sync-provider-card">
                    <div className="provider-header">
                      <h4>{provider.provider}</h4>
                      <span className={`sync-status ${provider.status}`}>
                        {provider.status === 'syncing' && `${provider.progress}%`}
                        {provider.status}
                      </span>
                    </div>
                    <div className="provider-stats">
                      <p>Items: {provider.itemsCount}</p>
                      <p>Storage: {provider.storageUsed}</p>
                    </div>
                    {provider.status === 'syncing' && (
                      <div className="progress-bar">
                        <div className="progress" style={{ width: `${provider.progress}%` }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
