import React, { useState } from 'react';
import TokenManagement from './admin/TokenManagement';
import PresaleManagement from './admin/PresaleManagement';
import UserDataView from './admin/UserDataView';
import styles from '../styles/components/AdminInterface.module.css';

const AdminInterface = ({ contracts, account, setLoading }) => {
  const [activeContract, setActiveContract] = useState('token');
  const [isWhitelistRequired, setIsWhitelistRequired] = useState(true);

  const togglePresaleType = async () => {
    try {
      setLoading(true);
      const result = await contracts.presale.setWhitelistRequired(!isWhitelistRequired);
      if (result) {
        setIsWhitelistRequired(!isWhitelistRequired);
        alert(`Presale type changed to ${!isWhitelistRequired ? 'Public' : 'Private'}`);
      } else {
        throw new Error("Failed to change presale type");
      }
    } catch (error) {
      console.error('Error toggling presale type:', error);
      alert('Failed to change presale type: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminDashboard}>
      <div className={styles.contractSwitcher}>
        <button
          className={`${styles.switchBtn} ${activeContract === 'token'? styles.active : ''}`}
          onClick={() => setActiveContract('token')}
        >
          Token Management
        </button>
        <button
          className={`${styles.switchBtn} ${activeContract === 'presale'? styles.active : ''}`}
          onClick={() => setActiveContract('presale')}
        >
          Presale Management
        </button>
        <button
          className={`${styles.switchBtn} ${activeContract === 'users'? styles.active : ''}`}
          onClick={() => setActiveContract('users')}
        >
          User Data
        </button>
      </div>
      {activeContract === 'token' && (
        <TokenManagement
          contract={contracts.token}
          account={account}
          setLoading={setLoading}
        />
      )}
      {activeContract === 'presale' && (
        <>
          <PresaleManagement
            contract={contracts.presale}
            account={account}
            setLoading={setLoading}
            isWhitelistRequired={isWhitelistRequired}
            togglePresaleType={togglePresaleType}
          />
        </>
      )}
      {activeContract === 'users' && (
        <UserDataView
          contract={contracts.presale}
          onLoadingChange={setLoading}
        />
      )}
    </div>
  );
};

export default AdminInterface;