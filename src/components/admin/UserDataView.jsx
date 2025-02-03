import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styles from '../../styles/components/UserDataView.module.css';

const UserDataView = ({ contract, onLoadingChange }) => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  const fetchUserData = async (address) => {
    try {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      if (!ethers.utils.isAddress(address)) {
        throw new Error("Invalid Ethereum address");
      }

      console.log('Fetching data for address:', address);

      const [
        isWhitelisted,
        vestedBalance,
        contribution,
        vestingInfo,
        claimStatus
      ] = await Promise.all([
        contract.callStatic.isWhitelisted(address),
        contract.callStatic.userVestings(address),
        contract.callStatic.contributions(address),
        contract.callStatic.getDetailedVestingInfo(address),
        contract.callStatic.getUserClaimStatus(address)
      ]);

      console.log('Whitelist status:', isWhitelisted);
      console.log('Vesting info:', vestingInfo);

      return {
        address,
        isWhitelisted,
        vestedBalance: ethers.utils.formatEther(vestedBalance.totalAmount),
        contribution: ethers.utils.formatEther(contribution),
        vestingInfo: {
          totalAmount: ethers.utils.formatEther(vestingInfo.totalAmount),
          claimedAmount: ethers.utils.formatEther(vestingInfo.claimedAmount),
          claimableNow: ethers.utils.formatEther(vestingInfo.claimableNow),
          nextClaimTime: vestingInfo.nextClaimTime.toString() === '0' 
            ? 'Not started' 
            : new Date(vestingInfo.nextClaimTime.toNumber() * 1000).toLocaleString(),
          remainingAmount: ethers.utils.formatEther(vestingInfo.remainingAmount),
          vestingEndTime: vestingInfo.vestingEndTime.toString() === '0' 
            ? 'Not set' 
            : new Date(vestingInfo.vestingEndTime.toNumber() * 1000).toLocaleString()
        },
        claimStatus: {
          canClaim: claimStatus.canClaim,
          claimableAmount: ethers.utils.formatEther(claimStatus.claimableAmount),
          nextClaimIn: claimStatus.nextClaimIn.toString(),
          message: claimStatus.message
        }
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message || "Failed to fetch user data");
      return null;
    }
  };

  const handleSearch = async () => {
    try {
      setError(null);
      if (!ethers.utils.isAddress(searchAddress)) {
        throw new Error('Please enter a valid Ethereum address');
      }

      setLoading(true);
      const data = await fetchUserData(searchAddress);
      if (data) {
        setUserData([data]);
      } else {
        throw new Error('No data found for this address');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message);
      setUserData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAllUsers = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const filter = contract.filters.TokensPurchased();
      const events = await contract.queryFilter(filter);
      
      if (!events.length) {
        throw new Error('No purchase events found');
      }

      const uniqueAddresses = [...new Set(events.map(event => event.args[0]))];
      console.log('Unique addresses found:', uniqueAddresses.length);
      
      const usersData = await Promise.all(
        uniqueAddresses.map(address => fetchUserData(address))
      );
      
      const validData = usersData.filter(data => data !== null);
      if (validData.length === 0) {
        throw new Error('No valid user data found');
      }

      setUserData(validData);
    } catch (error) {
      console.error('Error fetching all users:', error);
      setError(error.message || 'Failed to fetch users data');
      setUserData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.userDataView}>
      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Enter wallet address"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />
        <button 
          onClick={handleSearch}
          disabled={loading || !searchAddress}
        >
          Search
        </button>
        <button 
          onClick={handleFetchAllUsers}
          disabled={loading}
        >
          Fetch All Users
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading user data...</div>
      ) : (
        <div className={styles.userList}>
          {userData.length === 0 && !error ? (
            <div className={styles.noData}>No user data available</div>
          ) : (
            userData.map((user, index) => (
              <div key={index} className={styles.userCard}>
                <h3>User: {user.address.slice(0, 6)}...{user.address.slice(-4)}</h3>
                <div className={styles.userInfo}>
                  <p>Status: {user.isWhitelisted ? '✅ Whitelisted' : '❌ Not Whitelisted'}</p>
                  <p>Vested Balance: {user.vestedBalance} Tokens</p>
                  <p>Total Contribution: {user.contribution} ETH</p>
                  <p>Vesting Info:</p>
                  <ul>
                    <li>Total Amount: {user.vestingInfo.totalAmount} Tokens</li>
                    <li>Claimed Amount: {user.vestingInfo.claimedAmount} Tokens</li>
                    <li>Claimable Now: {user.vestingInfo.claimableNow} Tokens</li>
                    <li>Next Claim Time: {user.vestingInfo.nextClaimTime}</li>
                    <li>Remaining Amount: {user.vestingInfo.remainingAmount} Tokens</li>
                    <li>Vesting End Time: {user.vestingInfo.vestingEndTime}</li>
                  </ul>
                  <p>Claim Status:</p>
                  <ul>
                    <li>Can Claim: {user.claimStatus.canClaim ? 'Yes' : 'No'}</li>
                    <li>Claimable Amount: {user.claimStatus.claimableAmount} Tokens</li>
                    <li>Next Claim In: {user.claimStatus.nextClaimIn} seconds</li>
                    <li>Message: {user.claimStatus.message}</li>
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserDataView;
