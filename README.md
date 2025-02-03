# **Presale DApp**
A **decentralized presale platform** for managing **token sales, whitelisting, and vesting** with a secure and user-friendly interface. Built with **Next.js, Ethers.js, and Solidity**.

---

## **🚀 Features**
- **Secure Wallet Connection** (Metamask & WalletConnect)
- **Whitelist & Public Sale Modes**
- **Token Purchase & Vesting Mechanism**
- **Admin Dashboard for Presale Management**
- **Optimized Gas Usage & Security Best Practices**

---

## **🛠️ Tech Stack**
| Technology  | Description |
|-------------|------------|
| **Next.js** | React Framework for the frontend |
| **Ethers.js** | Ethereum blockchain interactions |
| **Solidity** | Smart contract development |
| **Tailwind CSS** | UI styling |
| **Web3Modal** | Wallet connection |
| **Infura** | Ethereum node provider |

---

## **🌜 Smart Contracts**
| Contract | Address | Description |
|----------|---------|-------------|
| **PlaceholderToken (RSKCoin)** | `0x54dB210F56Afa0dB6c249115d28A7Dfa133f7351` | ERC-20 Token for the presale |
| **Presale Contract** | `0xdD03C635cda87b1e8B4016142262C5e9B351CdEc` | Handles token sales & vesting |

---

## **🔧 Installation & Setup**
1️⃣ **Clone the Repository**
```bash
git clone https://github.com/Alhanafy01/ERC20TokenPresaleDapp.git
cd ERC20TokenPresaleDapp
```

2️⃣ **Install Dependencies**
```bash
npm install
```

3️⃣ **Environment Variables Setup**  
Create a `.env.local` file and add:
```plaintext
NEXT_PUBLIC_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
NEXT_PUBLIC_CONTRACT_ADDRESS="0xdD03C635cda87b1e8B4016142262C5e9B351CdEc"
```
🛑 **Do NOT expose API keys in public repositories.** Ensure `.env.local` is ignored in `.gitignore`.

4️⃣ **Run Development Server**
```bash
npm run dev
```
Access the DApp at: **`http://localhost:3000`**.

---

## **🚀 Deployment**
### **📌 Vercel Deployment**
1. **Build for Production**
   ```bash
   npm run build
   ```
2. **Deploy to Vercel**
   ```bash
   vercel
   ```

### **📌 Smart Contract Deployment**
To deploy the Solidity contracts:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
Ensure Infura keys and private keys are securely stored in `.env`.

---

## **👨‍💻 Contribution Guidelines**
1. **Fork the repository**
2. **Create a new branch** (`git checkout -b feature-name`)
3. **Commit changes** (`git commit -m "Added feature X"`)
4. **Push to GitHub** (`git push origin feature-name`)
5. **Open a Pull Request**

---

## **🌟 License**
This project is licensed under the **MIT License**.

---

