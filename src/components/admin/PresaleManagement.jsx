import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styles from '../../styles/components/PresaleManagement.module.css';

const PresaleManagement = ({ contract, account, setLoading }) => {
  const [presaleInfo, setPresaleInfo] = useState({
    tokenPrice: '0',
    totalTokensForSale: '0',
    tokensSold: '0',
    vestingDuration: '0',
    tgePercentage: '0',
    minContribution: '0',
    maxContribution: '0',
    isPaused: false,
    isWhitelistRequired: false,
    remainingTokens: '0'
  });

  const [whitelistAddress, setWhitelistAddress] = useState('');
  const [newTokenPrice, setNewTokenPrice] = useState('');
  const [newTgePercentage, setNewTgePercentage] = useState('');
  const [newNumberOfIntervals, setNewNumberOfIntervals] = useState('');
  const [newIntervalDuration, setNewIntervalDuration] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contract) {
      fetchPresaleInfo();
    }
  }, [contract]);

  const fetchPresaleInfo = async () => {
    try {
      setIsLoading(true);
      
      const detailedInfo = await contract.getDetailedPresaleInfo();
      console.log('Detailed Info:', detailedInfo);

      setPresaleInfo({
        tokenPrice: ethers.utils.formatEther(detailedInfo.price),
        totalTokensForSale: ethers.utils.formatEther(detailedInfo.remaining.add(detailedInfo.sold)),
        tokensSold: ethers.utils.formatEther(detailedInfo.sold),
        vestingDuration: detailedInfo.currentVesting.intervalDuration.toString(),
        tgePercentage: detailedInfo.currentVesting.tgePercentage.toString(),
        minContribution: ethers.utils.formatEther(detailedInfo.min),
        maxContribution: ethers.utils.formatEther(detailedInfo.max),
        isPaused: detailedInfo.isPaused,
        isWhitelistRequired: detailedInfo.isWhitelistRequired,
        remainingTokens: ethers.utils.formatEther(detailedInfo.remaining)
      });

    } catch (error) {
      console.error('Error fetching presale info:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhitelist = async () => {
    try {
      if (!ethers.utils.isAddress(whitelistAddress)) {
        alert('Invalid Ethereum address');
        return;
      }

      setLoading(true);
      const tx = await contract.addToWhitelist([whitelistAddress]);
      await tx.wait();
      setWhitelistAddress('');
      alert('Address successfully whitelisted!');
      await fetchPresaleInfo();
    } catch (error) {
      console.error('Whitelist error:', error);
      alert('Failed to whitelist address: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVestingConfig = async () => {
    try {
      setLoading(true);
      const tx = await contract.updateVestingConfig(
        newTgePercentage,
        newNumberOfIntervals,
        newIntervalDuration
      );
      await tx.wait();
      await fetchPresaleInfo();
      setNewTgePercentage('');
      setNewNumberOfIntervals('');
      setNewIntervalDuration('');
      alert('Vesting configuration updated successfully!');
    } catch (error) {
      console.error('Update vesting error:', error);
      alert('Failed to update vesting configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async () => {
    try {
      setLoading(true);
      const tx = await contract.updatePrice(ethers.utils.parseEther(newTokenPrice));
      await tx.wait();
      await fetchPresaleInfo();
      setNewTokenPrice('');
      alert('Token price updated successfully!');
    } catch (error) {
      console.error('Update price error:', error);
      alert('Failed to update token price: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePresaleState = async () => {
    try {
      setLoading(true);
      const tx = await contract.setPaused(!presaleInfo.isPaused);
      await tx.wait();
      await fetchPresaleInfo();
      alert(`Presale ${presaleInfo.isPaused ? 'resumed' : 'paused'} successfully!`);
    } catch (error) {
      console.error('Toggle presale state error:', error);
      alert('Failed to toggle presale state: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const UpdatePresalePrivatePublic = async () => {
    try {
      setLoading(true);
      const tx = await contract.setWhitelistRequired(!presaleInfo.isWhitelistRequired);
      await tx.wait();
      await fetchPresaleInfo();
      alert(`Presale ${presaleInfo.isWhitelistRequired ? 'Require whitelisting(Private is confiured)' : 'Not require whitelisting (Public is configured)'} successfully!`);
    } catch (error) {
      console.error('Toggle presale state error:', error);
      alert('Failed to toggle presale state: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  if (isLoading) {
    return <div className={styles.loading}>Loading presale information...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.presaleManagement}>
      <div className={styles.infoPanel}>
        <h3>Presale Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>Token Price:</label>
            <span>{presaleInfo.tokenPrice} ETH</span>
          </div>
          <div className={styles.infoItem}>
            <label>Total Tokens for Sale:</label>
            <span>{presaleInfo.totalTokensForSale}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Tokens Sold:</label>
            <span>{presaleInfo.tokensSold}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Remaining Tokens:</label>
            <span>{presaleInfo.remainingTokens}</span>
          </div>
          <div className={styles.infoItem}>
            <label>TGE Percentage:</label>
            <span>{presaleInfo.tgePercentage}%</span>
          </div>
          <div className={styles.infoItem}>
            <label>Min Contribution:</label>
            <span>{presaleInfo.minContribution} ETH</span>
          </div>
          <div className={styles.infoItem}>
            <label>Max Contribution:</label>
            <span>{presaleInfo.maxContribution} ETH</span>
          </div>
          <div className={styles.infoItem}>
            <label>Status:</label>
            <span>{presaleInfo.isPaused ? 'Paused' : 'Active'}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Whitelist Required:</label>
            <span>{presaleInfo.isWhitelistRequired ? 'Yes' : 'No'}</span>
          </div>
          <div className={styles.infoItem}>
            <label>IS Pause  Required:</label>
            <span>{presaleInfo.isPaused ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      <div className={styles.actionPanel}>
        <div className={styles.whitelistSection}>
          <h3>Whitelist Management</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Address to whitelist"
              value={whitelistAddress}
              onChange={(e) => setWhitelistAddress(e.target.value)}
            />
            <button onClick={handleWhitelist}>Add to Whitelist</button>
          </div>
        </div>

        <div className={styles.vestingSection}>
          <h3>Vesting Configuration</h3>
          <div className={styles.inputGroup}>
            <input
              type="number"
              placeholder="TGE Percentage"
              value={newTgePercentage}
              onChange={(e) => setNewTgePercentage(e.target.value)}
            />
            <input
              type="number"
              placeholder="Number of Intervals"
              value={newNumberOfIntervals}
              onChange={(e) => setNewNumberOfIntervals(e.target.value)}
            />
            <input
              type="number"
              placeholder="Interval Duration (seconds)"
              value={newIntervalDuration}
              onChange={(e) => setNewIntervalDuration(e.target.value)}
            />
            <button onClick={updateVestingConfig}>Update Vesting</button>
          </div>
        </div>

        <div className={styles.priceSection}>
          <h3>Price Management</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="New Token Price (ETH)"
              value={newTokenPrice}
              onChange={(e) => setNewTokenPrice(e.target.value)}
            />
            <button onClick={updatePrice}>Update Price</button>
          </div>
        </div>

        <div className={styles.priceSection}>
          <h3>Presale -private / public- Management</h3>
          <div className={styles.inputGroup}>
            <button onClick={UpdatePresalePrivatePublic}>
              {presaleInfo.isWhitelistRequired ? 'Require whitelisting(Private is confiured)' : 'Not require whitelisting (Public is configured)'}
            </button>
          </div>
        </div>


        <div className={styles.toggleSection}>
          <h3>Presale Controls</h3>
          <div className={styles.inputGroup}>
            <button onClick={togglePresaleState}>
              {presaleInfo.isPaused ? 'Resume Presale' : 'Pause Presale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresaleManagement;
