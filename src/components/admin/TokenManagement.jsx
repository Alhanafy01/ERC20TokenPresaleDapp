import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styles from '../../styles/components/TokenManagement.module.css';

const TokenManagement = ({ contract, account, setLoading }) => {
  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    cap: '',
    paused: false,
    owner: '',
    decimals: 0
  });
  const [mintAmount, setMintAmount] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [spender, setSpender] = useState('');
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [balanceAddress, setBalanceAddress] = useState('');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    fetchTokenInfo();
  }, [contract]);

  const fetchTokenInfo = async () => {
    try {
      if (!contract) return;
  
      const [name, symbol, totalSupply, cap, owner, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
        contract.cap(),
        contract.owner(),
        contract.decimals()
      ]);
  
      console.log('Token Info Fetched:', { name, symbol, totalSupply, cap }); // Debug log
  
      setTokenInfo({
        name,
        symbol,
        totalSupply: ethers.utils.formatEther(totalSupply),
        cap: ethers.utils.formatEther(cap),
        owner,
        decimals
      });
    } catch (error) {
      console.error('Error fetching token info:', error);
    }
  };
  

  const handleMint = async () => {
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(mintAmount);
      const tx = await contract.mint(mintAddress || account, amount);
      await tx.wait();
      await fetchTokenInfo();
      setMintAmount('');
      setMintAddress('');
      alert('Tokens minted successfully!');
    } catch (error) {
      console.error('Minting error:', error);
      alert('Failed to mint tokens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBurn = async () => {
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(burnAmount);
      const tx = await contract.burn(amount);
      await tx.wait();
      await fetchTokenInfo();
      setBurnAmount('');
      alert('Tokens burned successfully!');
    } catch (error) {
      console.error('Burning error:', error);
      alert('Failed to burn tokens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setLoading(true);
      const tx = await contract.pause();
      await tx.wait();
      await fetchTokenInfo();
      alert('Token paused successfully!');
    } catch (error) {
      console.error('Pause error:', error);
      alert('Failed to pause token: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpause = async () => {
    try {
      setLoading(true);
      const tx = await contract.unpause();
      await tx.wait();
      await fetchTokenInfo();
      alert('Token unpaused successfully!');
    } catch (error) {
      console.error('Unpause error:', error);
      alert('Failed to unpause token: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    try {
      setLoading(true);
      const tx = await contract.transferOwnership(newOwner);
      await tx.wait();
      await fetchTokenInfo();
      setNewOwner('');
      alert('Ownership transferred successfully!');
    } catch (error) {
      console.error('Ownership transfer error:', error);
      alert('Failed to transfer ownership: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(allowanceAmount);
      const tx = await contract.approve(spender, amount);
      await tx.wait();
      alert('Allowance set successfully!');
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to set allowance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    try {
      const balance = await contract.balanceOf(balanceAddress);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Balance check error:', error);
      alert('Failed to check balance: ' + error.message);
    }
  };

  return (
    <div className={styles.tokenManagement}>
      <div className={styles.infoPanel}>
        <h3>Token Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>Name:</label>
            <span>{tokenInfo.name}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Symbol:</label>
            <span>{tokenInfo.symbol}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Total Supply:</label>
            <span>{tokenInfo.totalSupply}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Cap:</label>
            <span>{tokenInfo.cap}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Paused:</label>
            <span>{tokenInfo.paused ? 'Yes' : 'No'}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Owner:</label>
            <span>{tokenInfo.owner}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Decimals:</label>
            <span>{tokenInfo.decimals}</span>
          </div>
        </div>
      </div>

      <div className={styles.actionPanel}>
        <h3>Mint Tokens</h3>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Amount to mint"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
          <input
            type="text"
            placeholder="Recipient address (optional)"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
          />
          <button onClick={handleMint}>Mint Tokens</button>
        </div>

        <h3>Burn Tokens</h3>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Amount to burn"
            value={burnAmount}
            onChange={(e) => setBurnAmount(e.target.value)}
          />
          <button onClick={handleBurn}>Burn Tokens</button>
        </div>

        <h3>Pause/Unpause Token</h3>
        <div className={styles.inputGroup}>
          <button onClick={handlePause} disabled={tokenInfo.paused}>Pause Token</button>
          <button onClick={handleUnpause} disabled={!tokenInfo.paused}>Unpause Token</button>
        </div>

        <h3>Transfer Ownership</h3>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="New owner address"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
          />
          <button onClick={handleTransferOwnership}>Transfer Ownership</button>
        </div>

        <h3>Set Allowance</h3>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Spender address"
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
          />
          <input
            type="text"
            placeholder="Allowance amount"
            value={allowanceAmount}
            onChange={(e) => setAllowanceAmount(e.target.value)}
          />
          <button onClick={handleApprove}>Approve</button>
        </div>

        <h3>Check Balance</h3>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Address to check"
            value={balanceAddress}
            onChange={(e) => setBalanceAddress(e.target.value)}
          />
          <button onClick={handleCheckBalance}>Check Balance</button>
          {balance && <p>Balance: {balance} Tokens</p>}
        </div>
      </div>
    </div>
  );
};

export default TokenManagement;
