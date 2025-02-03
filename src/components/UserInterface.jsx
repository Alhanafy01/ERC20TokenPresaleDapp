import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styles from '../styles/components/UserInterface.module.css';

const UserInterface = ({ contracts, account, setLoading: setGlobalLoading }) => {
  console.log('UserInterface Mounted - Initial Props:', { contracts, account });

  const [presaleInfo, setPresaleInfo] = useState({
    isWhitelistedRequired: false,
  isWhitelistedUser:false,
    tokenPrice: '0',
    vestedBalance: '0',
    minContribution: '0',
    maxContribution: '0',
    totalTokensForSale: '0',
    soldTokens: '0',
    remainingTokens: '0',
    vestingConfig: {
      tgePercentage: '0',
      numberOfIntervals: '0',
      intervalDuration: '0'
    }
  });

  const [ethAmount, setEthAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const [vestingInfo, setVestingInfo] = useState({
    totalAmount: '0',
    claimedAmount: '0',
    claimableNow: '0',
    nextClaimTime: '0',
    remainingAmount: '0',
    vestingEndTime: '0'
  });
  const [canClaim, setCanClaim] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserInfo = async () => {
    try {
      console.log('Fetching user info - Contract:', contracts?.presale?.address);
      console.log('Current account:', account);

      if (!contracts?.presale || !account) {
        console.log('Missing requirements:', { 
          hasContract: !!contracts?.presale, 
          hasAccount: !!account 
        });
        return;
      }
// and  ( false and anything) > false
// or ( flase or anything ) anything
      const isWhitelistedRequired = await contracts.presale.whitelistRequired();

      const isWhitelistedUser = await contracts.presale.callStatic.isWhitelisted(account);

      console.log('Whitelist Requireed status:', isWhitelistedRequired);
      console.log('User Is Whitelisted:', isWhitelistedUser);

      const [
        tokenPrice,
        vestedBalance,
        minContribution,
        maxContribution,
        totalTokensForSale,
        soldTokens,
        vestingConfig
      ] = await Promise.all([
        contracts.presale.callStatic.tokenPrice(),
        contracts.presale.callStatic.userVestings(account),
        contracts.presale.callStatic.minContribution(),
        contracts.presale.callStatic.maxContribution(),
        contracts.presale.callStatic.totalTokensForSale(),
        contracts.presale.callStatic.soldTokens(),
        contracts.presale.callStatic.vestingConfig()
      ]);

      const remainingTokens = totalTokensForSale.sub(soldTokens);

      setPresaleInfo({
        isWhitelistedRequired,
        isWhitelistedUser,
        tokenPrice: ethers.utils.formatEther(tokenPrice),
        vestedBalance: ethers.utils.formatEther(vestedBalance.totalAmount),
        minContribution: ethers.utils.formatEther(minContribution),
        maxContribution: ethers.utils.formatEther(maxContribution),
        totalTokensForSale: ethers.utils.formatEther(totalTokensForSale),
        soldTokens: ethers.utils.formatEther(soldTokens),
        remainingTokens: ethers.utils.formatEther(remainingTokens),
        vestingConfig: {
          tgePercentage: vestingConfig.tgePercentage.toString(),
          numberOfIntervals: vestingConfig.numberOfIntervals.toString(),
          intervalDuration: vestingConfig.intervalDuration.toString()
        }
      });
    } catch (error) {
      console.error('Error in fetchUserInfo:', error);
      setError(error.message);
    }
  };

  const checkVestingStatus = async () => {
    try {
      if (!contracts?.presale || !account) return;

      const vestingInfo = await contracts.presale.callStatic.getDetailedVestingInfo(account);
      console.log('Vesting info:', vestingInfo);

      setVestingInfo({
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
      });

      setCanClaim(vestingInfo.claimableNow.gt(0));
    } catch (error) {
      console.error('Error checking vesting status:', error);
      setCanClaim(false);
    }
  };

  useEffect(() => {
    if (contracts?.presale && account) {
      fetchUserInfo();
      checkVestingStatus();
      
      const userInfoInterval = setInterval(fetchUserInfo, 15000);
      const vestingInterval = setInterval(checkVestingStatus, 1000);
      
      return () => {
        clearInterval(userInfoInterval);
        clearInterval(vestingInterval);
      };
    }
  }, [contracts, account]);

  useEffect(() => {
    if (ethAmount && presaleInfo.tokenPrice !== '0') {
      const tokens = Number(ethAmount) / Number(presaleInfo.tokenPrice);
      setEstimatedTokens(tokens.toFixed(4));
    } else {
      setEstimatedTokens('0');
    }
  }, [ethAmount, presaleInfo.tokenPrice]);

  const handlePurchase = async () => {
    try {
      if (!presaleInfo.isWhitelistedUser) {
        alert('You are not whitelisted for this presale');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(account);
      const ethValue = ethers.utils.parseEther(ethAmount);
      
      const totalRequired = ethValue;
      if (balance.lt(totalRequired)) {
        alert(`Insufficient balance. You have ${ethers.utils.formatEther(balance)} ETH`);
        return;
      }

      setIsLoading(true);
      setGlobalLoading(true);
      const tx = await contracts.presale.buyTokens({ value: ethValue });
      await tx.wait();
      await fetchUserInfo();
      setEthAmount('');
      alert('Tokens purchased successfully!');
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase tokens: ' + error.message);
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      const claimableAmount = ethers.utils.parseEther(vestingInfo.claimableNow);
      if (claimableAmount.isZero()) {
        alert('No vested tokens available to claim');
        return;
      }

      setIsLoading(true);
      setGlobalLoading(true);
      const tx = await contracts.presale.claimVestedTokens();
      await tx.wait();
      await checkVestingStatus();
      alert('Tokens claimed successfully!');
    } catch (error) {
      console.error('Claim error:', error);
      alert('Failed to claim tokens: ' + error.message);
    } finally {
      setIsLoading(false);
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (presaleInfo.isWhitelistedRequired )  {

    if(presaleInfo.isWhitelistedUser)
      {
    // user is whitelisted 
  
    console.log('User Is Whitelisted Entered:', isWhitelistedUser);

  
  return (
    <div className={styles.userInterface}>
      <div className={styles.presaleInfo}>
        <h2>Presale Information</h2>
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
            <span>{presaleInfo.soldTokens}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Remaining Tokens:</label>
            <span>{presaleInfo.remainingTokens}</span>
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
            <label>Vesting TGE Percentage:</label>
            <span>{presaleInfo.vestingConfig.tgePercentage}%</span>
          </div>
          <div className={styles.infoItem}>
            <label>Vesting Intervals:</label>
            <span>{presaleInfo.vestingConfig.numberOfIntervals}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Vesting Interval Duration:</label>
            <span>{presaleInfo.vestingConfig.intervalDuration} seconds</span>
          </div>
          
                  </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.purchaseSection}>
          <h3>Purchase Tokens</h3>
          <div className={styles.inputGroup}>
            <div className={styles.inputInfo}>
              <span>Estimated Tokens: {estimatedTokens}</span>
            </div>
            <input
              type="number"
              placeholder="Amount of ETH to spend"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              min={presaleInfo.minContribution}
              max={presaleInfo.maxContribution}
              step="0.000000000000000001"
              className={styles.input}
            />
            <button 
              className={`${styles.button} ${!ethAmount || ethAmount <= 0 ? styles.buttonDisabled : ''}`}
              onClick={handlePurchase}
              disabled={!ethAmount || ethAmount <= 0}
            >
              Purchase Tokens
            </button>
          </div>
        </div>

        {Number(vestingInfo.totalAmount) > 0 && (
          <div className={styles.claimSection}>
            <h3>Vesting Information</h3>
            <div className={styles.claimInfo}>
              <p>Total Vested: {vestingInfo.totalAmount} Tokens</p>
              <p>Claimed: {vestingInfo.claimedAmount} Tokens</p>
              <p>Claimable Now: {vestingInfo.claimableNow} Tokens</p>
              <p>Remaining: {vestingInfo.remainingAmount} Tokens</p>
              <p>Next Claim Time: {vestingInfo.nextClaimTime}</p>
              <p>Vesting End Time: {vestingInfo.vestingEndTime}</p>
            </div>
           
            <button 
              className={`${styles.button} ${!canClaim ? styles.buttonDisabled : ''}`}
              onClick={handleClaim}
              disabled={!canClaim}
            >
              {canClaim ? 'Claim Vested Tokens' : `Waiting for vesting (${vestingInfo.nextClaimTime})`}
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Processing transaction...</p>
        </div>
      )}
    </div>
  );

      }
      else
      {
// user is not whitelisted
return (
  <div className={styles.notWhitelisted}>
    <h2>Not Whitelisted</h2>
    <p>You are not whitelisted for this presale. Please contact the administrator.</p>
  </div>
);

      }
   
  }

  else  
  
 { 

 
  
  
  
  return (
    <div className={styles.userInterface}>
      <div className={styles.presaleInfo}>
        <h2>Presale Information</h2>
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
            <span>{presaleInfo.soldTokens}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Remaining Tokens:</label>
            <span>{presaleInfo.remainingTokens}</span>
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
            <label>Vesting TGE Percentage:</label>
            <span>{presaleInfo.vestingConfig.tgePercentage}%</span>
          </div>
          <div className={styles.infoItem}>
            <label>Vesting Intervals:</label>
            <span>{presaleInfo.vestingConfig.numberOfIntervals}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Vesting Interval Duration:</label>
            <span>{presaleInfo.vestingConfig.intervalDuration} seconds</span>
          </div>
          
                  </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.purchaseSection}>
          <h3>Purchase Tokens</h3>
          <div className={styles.inputGroup}>
            <div className={styles.inputInfo}>
              <span>Estimated Tokens: {estimatedTokens}</span>
            </div>
            <input
              type="number"
              placeholder="Amount of ETH to spend"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              min={presaleInfo.minContribution}
              max={presaleInfo.maxContribution}
              step="0.000000000000000001"
              className={styles.input}
            />
            <button 
              className={`${styles.button} ${!ethAmount || ethAmount <= 0 ? styles.buttonDisabled : ''}`}
              onClick={handlePurchase}
              disabled={!ethAmount || ethAmount <= 0}
            >
              Purchase Tokens
            </button>
          </div>
        </div>

        {Number(vestingInfo.totalAmount) > 0 && (
          <div className={styles.claimSection}>
            <h3>Vesting Information</h3>
            <div className={styles.claimInfo}>
              <p>Total Vested: {vestingInfo.totalAmount} Tokens</p>
              <p>Claimed: {vestingInfo.claimedAmount} Tokens</p>
              <p>Claimable Now: {vestingInfo.claimableNow} Tokens</p>
              <p>Remaining: {vestingInfo.remainingAmount} Tokens</p>
              <p>Next Claim Time: {vestingInfo.nextClaimTime}</p>
              <p>Vesting End Time: {vestingInfo.vestingEndTime}</p>
            </div>
            <button 
              className={`${styles.button} ${!canClaim ? styles.buttonDisabled : ''}`}
              onClick={handleClaim}
              disabled={!canClaim}
            >
              {canClaim ? 'Claim Vested Tokens' : `Waiting for vesting (${vestingInfo.nextClaimTime})`}
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Processing transaction...</p>
        </div>
      )}
    </div>
  );
}
};

export default UserInterface;
