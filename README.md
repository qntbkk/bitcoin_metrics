# Bitcoin Metrics Dashboard

A comprehensive real-time Bitcoin network monitoring dashboard built with React.js that displays price information, mining metrics, network statistics, and blockchain data.

## Features

- **Real-time Price Data**: Live Bitcoin price with 24-hour change tracking
- **Mining Metrics**: Block rewards, mining difficulty, hashrate, and profitability calculations
- **Network Statistics**: Block height, mempool size, and fee recommendations
- **Mining Pool Distribution**: Analysis of recent mining pool activity
- **Difficulty Adjustment Tracking**: Countdown and predictions for next difficulty change
- **Recent Blocks**: Latest blockchain activity with transaction counts and fees
- **Auto-refresh**: Data updates every 30 seconds automatically

## Technologies Used

- React 18
- Tailwind CSS (via CDN)
- Lucide React (for icons)
- mempool.space API
- CoinGecko API

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd bitcoin_metrics
Install dependencies:
npm install
Start the development server:
npm start
Open http://localhost:3000 to view it in the browser.
Build for Production
npm run build
This creates an optimized production build in the build folder.

Deployment on Vercel
Install Vercel CLI:
npm install -g vercel
Login to Vercel:
vercel login
Deploy:
vercel --prod
Alternatively, you can connect your GitHub repository to Vercel for automatic deployments.

API Sources
Price Data: CoinGecko API
Blockchain Data: mempool.space API
Mining Statistics: Derived from blockchain data
License
MIT License
```
