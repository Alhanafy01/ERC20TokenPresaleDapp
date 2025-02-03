import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AdminInterface from './components/AdminInterface';
import UserInterface from './components/UserInterface';
import './styles/global.css';

import PresaleABI from './abis/Presale.json';
import TokenABI from './abis/PlaceholderToken.json';

const presaleAddress = "0xdD03C635cda87b1e8B4016142262C5e9B351CdEc";
const tokenAddress = "0x54dB210F56Afa0dB6c249115d28A7Dfa133f7351";

const App = () => {
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [contracts, setContracts] = useState({ presale: null, token: null });
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const presaleContract = new ethers.Contract(presaleAddress, PresaleABI.abi, signer);
          
          try {
            const presaleOwner = await presaleContract.owner();
            const isOwnerAccount = accounts[0].toLowerCase() === presaleOwner.toLowerCase();
            
            setAccount(accounts[0]);
            setIsOwner(isOwnerAccount);
          } catch (error) {
            console.error('Error checking owner:', error);
            setAccount(accounts[0]);
            setIsOwner(false);
          }
        } else {
          setAccount(null);
          setIsOwner(false);
        }
      });

      // Handle chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
    console.log('State Monitor - Account:', account);
    console.log('State Monitor - Is Owner:', isOwner);
    console.log('State Monitor - Contracts:', contracts);
  }, [account, isOwner, contracts]);

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        console.log('Network Monitor:', network);
        setNetwork(network);
      }
    };
    checkNetwork();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }
  
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = provider.getSigner();
      
      // Debug logs
      console.log('Connecting wallet...');
      console.log('Account:', accounts[0]);
      
      // Initialize contracts
      const presaleContract = new ethers.Contract(
        presaleAddress, 
        PresaleABI.abi,
        signer
      );
      const tokenContract = new ethers.Contract(
        tokenAddress, 
        TokenABI.abi,
        signer
      );
  
      // Check owner status
      const presaleOwner = await presaleContract.owner();
      const isOwnerAccount = accounts[0].toLowerCase() === presaleOwner.toLowerCase();
      
      // Debug logs
      console.log('Contract Owner:', presaleOwner);
      console.log('Is Owner:', isOwnerAccount);
  
      setAccount(accounts[0]);
      setIsOwner(isOwnerAccount);
      setContracts({ presale: presaleContract, token: tokenContract });
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Token Presale DApp</h1>
        {!account ? (
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
          </div>
        )}
      </header>
      
      {account && (
        isOwner ? (
          <AdminInterface 
            contracts={contracts}
            account={account}
            setLoading={setLoading}
          />
        ) : (
          <UserInterface 
            contracts={contracts}
            account={account}
            setLoading={setLoading}
          />
        )
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default App;
