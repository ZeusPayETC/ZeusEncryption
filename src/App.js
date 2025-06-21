// src/App.js
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import CryptoJS from 'crypto-js';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import splashImg from './assets/splash.jpg';
import backgroundImg from './assets/background.jpg';

import contractABI from './abi/contractABI.json';
import tokenABI from './abi/tokenABI.json';

const contractAddress = '0xe4b3A345666926E28699638452bb0241d4f5e1ac';
const tokenAddress = '0x66e97838A985cf070B9F955c4025f1C7825de44F';

function App() {
  const [account, setAccount] = useState(null);
  const [zeusBalance, setZeusBalance] = useState('0');
  const [passphrase, setPassphrase] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [encryptedOutput, setEncryptedOutput] = useState('');
  const [decryptedOutput, setDecryptedOutput] = useState('');

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [zeusContract, setZeusContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [hasDeposited, setHasDeposited] = useState(false); // ✅ NEW STATE

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const _provider = new ethers.providers.Web3Provider(window.ethereum);
        await _provider.send('eth_requestAccounts', []);
        const _signer = _provider.getSigner();
        const _account = await _signer.getAddress();

        const _zeusContract = new ethers.Contract(contractAddress, contractABI, _signer);
        const _tokenContract = new ethers.Contract(tokenAddress, tokenABI, _signer);

        setProvider(_provider);
        setSigner(_signer);
        setAccount(_account);
        setZeusContract(_zeusContract);
        setTokenContract(_tokenContract);

        toast.success(`Connected: ${_account}`);
        updateZeusBalance(_tokenContract, _account);
        checkHasDeposited(_zeusContract, _account); // ✅ CHECK IF DEPOSITED
      } else {
        toast.error('Please install MetaMask!');
      }
    } catch (error) {
      console.error(error);
      toast.error(`Connection failed: ${error.message}`);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setZeusContract(null);
    setTokenContract(null);
    setZeusBalance('0');
    setHasDeposited(false);
    toast.info('Wallet disconnected');
  };

  const updateZeusBalance = async (_tokenContract = tokenContract, _account = account) => {
    if (!_tokenContract || !_account) return;
    try {
      const balance = await _tokenContract.balanceOf(_account);
      setZeusBalance(ethers.utils.formatUnits(balance, 18));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch balance.');
    }
  };

  const checkHasDeposited = async (_zeusContract = zeusContract, _account = account) => {
    if (!_zeusContract || !_account) return;
    try {
      const deposited = await _zeusContract.hasDeposited(_account);
      setHasDeposited(deposited);
    } catch (error) {
      console.error(error);
      toast.error('Failed to check deposit status.');
    }
  };

  const depositZEUS = async () => {
    if (!tokenContract || !zeusContract) {
      toast.error('Wallet not connected.');
      return;
    }
    try {
      const amount = ethers.utils.parseUnits('10000', 18);
      const tx = await tokenContract.approve(contractAddress, amount);
      await tx.wait();
      const depositTx = await zeusContract.depositZEUS();
      await depositTx.wait();
      toast.success('Deposit successful!');
      updateZeusBalance();
      checkHasDeposited(); // ✅ Update deposit status after depositing
    } catch (error) {
      console.error(error);
      toast.error(`Deposit failed: ${error.reason || error.message}`);
    }
  };

  const encryptMessage = () => {
    if (!hasDeposited) {
      toast.error('Please deposit 10,000 ZEUS before encrypting.');
      return;
    }
    if (!passphrase || !plaintext) {
      toast.error('Passphrase and message are required.');
      return;
    }
    try {
      const ciphertext = CryptoJS.AES.encrypt(plaintext, passphrase).toString();
      setEncryptedOutput(ciphertext);
      toast.success('Message encrypted!');
    } catch (error) {
      console.error(error);
      toast.error(`Encryption failed: ${error.message}`);
    }
  };

  const decryptMessage = () => {
    if (!passphrase || !encryptedOutput) {
      toast.error('Passphrase and encrypted message are required.');
      return;
    }
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedOutput, passphrase);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalText) {
        toast.error('Invalid passphrase or corrupted ciphertext.');
        return;
      }
      setDecryptedOutput(originalText);
      toast.success('Message decrypted!');
    } catch (error) {
      console.error(error);
      toast.error(`Decryption failed: ${error.message}`);
    }
  };

  const truncateAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <>
      <Helmet>
        <title>ZEUS Encryption App - Web3 Blockchain Encryption Tool</title>
        <meta
          name="description"
          content="ZEUS Encryption is a secure Web3 application for encrypting and decrypting messages using blockchain and your crypto wallet. Deposit ZEUS tokens to power AES encryption on Ethereum Classic."
        />
        <meta
          name="keywords"
          content="secure online message encryption app, encrypt and decrypt messages online free, Web3 encryption and decryption tool, blockchain-based encryption application, secure passphrase encryption online, how to encrypt text with blockchain, decentralized encryption dApp, Ethereum encryption smart contract, encrypt messages using crypto tokens, online AES encryption Web3 app"
        />
      </Helmet>

      <div id="splash" style={{ backgroundImage: `url(${splashImg})` }} />

      <div id="backgroundWrapper" style={{ backgroundImage: `url(${backgroundImg})` }}>
        <div id="wallet-section">
          {account ? (
            <>
              <button className="disconnect-button" onClick={disconnectWallet}>Disconnect</button>
              <span>{truncateAddress(account)}</span>
            </>
          ) : (
            <>
              <button onClick={connectWallet}>Connect Wallet</button>
              <span>Not connected</span>
            </>
          )}
        </div>

        <div className="container">
          <h2>ZEUS Encryption</h2>
          <p>ZEUS Balance: {zeusBalance}</p>
          <button id="depositButton" onClick={depositZEUS}>Deposit 10,000 ZEUS</button>

          <label htmlFor="passphrase">Passphrase:</label>
          <input
            type="password"
            id="passphrase"
            placeholder="Enter passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />

          <label htmlFor="plaintext">Message to Encrypt:</label>
          <textarea
            id="plaintext"
            placeholder="Enter text"
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
          ></textarea>

          <button
            id="encryptButton"
            onClick={encryptMessage}
            disabled={!hasDeposited} // ✅ DISABLE IF NOT DEPOSITED
          >
            Encrypt
          </button>

          <label htmlFor="encryptedOutput">Encrypted Message:</label>
          <textarea
            id="encryptedOutput"
            placeholder="Paste encrypted message here"
            value={encryptedOutput}
            onChange={(e) => setEncryptedOutput(e.target.value)}
          ></textarea>

          <button id="decryptButton" onClick={decryptMessage}>Decrypt</button>

          <label htmlFor="decryptedOutput">Decrypted Message:</label>
          <textarea id="decryptedOutput" value={decryptedOutput} readOnly />
        </div>
      </div>

      <ToastContainer />
    </>
  );
}

export default App;
