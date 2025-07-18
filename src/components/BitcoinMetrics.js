import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Blocks,
  Zap,
  Clock,
  DollarSign,
  BarChart3,
  Pickaxe,
  Users,
  Award,
  Calculator,
} from "lucide-react";

const BitcoinMetrics = () => {
  const [bitcoinData, setBitcoinData] = useState({
    // Price data
    price: null,
    priceChange24h: null,

    // Network data
    difficulty: null,
    blockHeight: null,
    hashrate: null,
    nextDifficultyAdjustment: null,
    mempoolSize: null,
    avgBlockTime: null,
    networkFeeRate: null,

    // Mining data
    blockReward: null,
    totalMiningRevenue: null,
    blockSubsidy: null,
    totalFees: null,
    recentBlocks: [],
    miningPools: [],
    difficultyChange: null,
    blocksUntilAdjustment: null,

    loading: true,
    error: null,
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Format large numbers
  const formatNumber = (num) => {
    if (!num) return "N/A";
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  // Format hash rate
  const formatHashrate = (hashrate) => {
    if (!hashrate) return "N/A";
    const ehs = hashrate / 1e18;
    return `${ehs.toFixed(2)} EH/s`;
  };

  // Format difficulty
  const formatDifficulty = (difficulty) => {
    if (!difficulty) return "N/A";
    return (difficulty / 1e12).toFixed(2) + "T";
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "N/A";
    return `${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format Bitcoin amount
  const formatBTC = (amount) => {
    if (!amount) return "N/A";
    return `${(amount / 100000000).toFixed(8)} BTC`;
  };

  // Calculate mining profitability (simplified)
  const calculateMiningProfitability = (price, difficulty, hashrate) => {
    if (!price || !difficulty || !hashrate) return "N/A";
    // Simplified calculation for 1 TH/s
    const dailyBTC = (1e12 / hashrate) * 144 * 6.25; // 144 blocks per day, 6.25 BTC reward
    const dailyUSD = dailyBTC * price;
    return `${dailyUSD.toFixed(2)}/day per TH/s`;
  };

  // Fetch Bitcoin data from multiple APIs
  const fetchBitcoinData = async () => {
    try {
      setBitcoinData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch price data from CoinGecko
      const priceResponse = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
      );
      const priceData = await priceResponse.json();

      // Fetch blockchain data from mempool.space
      const [
        difficultyResponse,
        blockResponse,
        hashrateResponse,
        mempoolResponse,
        feeResponse,
        recentBlocksResponse,
      ] = await Promise.all([
        fetch("https://mempool.space/api/v1/difficulty-adjustment"),
        fetch("https://mempool.space/api/blocks/tip/height"),
        fetch("https://mempool.space/api/v1/mining/hashrate/1d"),
        fetch("https://mempool.space/api/mempool"),
        fetch("https://mempool.space/api/v1/fees/recommended"),
        fetch("https://mempool.space/api/v1/blocks"),
      ]);

      const difficultyData = await difficultyResponse.json();
      const blockHeight = await blockResponse.json();
      const hashrateData = await hashrateResponse.json();
      const mempoolData = await mempoolResponse.json();
      const feeData = await feeResponse.json();
      const recentBlocksData = await recentBlocksResponse.json();

      // Calculate mining metrics
      const currentBlockReward = 6.25; // Current block subsidy (will be 3.125 after next halving)
      const avgFeesPerBlock =
        recentBlocksData.length > 0
          ? recentBlocksData
              .slice(0, 10)
              .reduce((sum, block) => sum + (block.extras?.totalFees || 0), 0) /
            10
          : 0;

      const totalBlockReward = currentBlockReward + avgFeesPerBlock / 100000000;
      const dailyMiningRevenue = totalBlockReward * 144 * priceData.bitcoin.usd; // 144 blocks per day

      // Get mining pool data from recent blocks
      const poolStats = {};
      recentBlocksData.slice(0, 100).forEach((block) => {
        const poolName = block.extras?.pool?.name || "Unknown";
        poolStats[poolName] = (poolStats[poolName] || 0) + 1;
      });

      const miningPools = Object.entries(poolStats)
        .map(([name, blocks]) => ({
          name,
          blocks,
          percentage: (blocks / 100) * 100,
        }))
        .sort((a, b) => b.blocks - a.blocks)
        .slice(0, 5);

      setBitcoinData({
        // Price data
        price: priceData.bitcoin.usd,
        priceChange24h: priceData.bitcoin.usd_24h_change,

        // Network data
        difficulty: difficultyData.difficulty,
        blockHeight: blockHeight,
        hashrate: hashrateData.currentHashrate,
        nextDifficultyAdjustment: difficultyData.estimatedRetargetDate,
        mempoolSize: mempoolData.count,
        avgBlockTime: difficultyData.timeAvg,
        networkFeeRate: feeData.fastestFee,

        // Mining data
        blockReward: totalBlockReward,
        totalMiningRevenue: dailyMiningRevenue,
        blockSubsidy: currentBlockReward,
        totalFees: avgFeesPerBlock,
        recentBlocks: recentBlocksData.slice(0, 10),
        miningPools: miningPools,
        difficultyChange: difficultyData.difficultyChange,
        blocksUntilAdjustment: difficultyData.remainingBlocks,

        loading: false,
        error: null,
      });

      setLastUpdate(new Date());
    } catch (error) {
      setBitcoinData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch Bitcoin data. Please try again.",
      }));
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    fetchBitcoinData();
    const interval = setInterval(fetchBitcoinData, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="ml-1 text-sm font-medium">
              {Math.abs(trend).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );

  const MiningPoolCard = ({ pools }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-lg bg-yellow-500">
          <Users size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 ml-3">
          Mining Pool Distribution
        </h3>
      </div>
      <div className="space-y-3">
        {pools.map((pool, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: `hsl(${index * 72}, 70%, 50%)` }}
              ></div>
              <span className="text-sm font-medium text-gray-700">
                {pool.name}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {pool.percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">{pool.blocks} blocks</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">Based on last 100 blocks</p>
    </div>
  );

  const RecentBlocksCard = ({ blocks }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-lg bg-indigo-500">
          <Blocks size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 ml-3">
          Recent Blocks
        </h3>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {blocks.map((block, index) => (
          <div
            key={index}
            className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
          >
            <div>
              <div className="font-medium text-gray-900">#{block.height}</div>
              <div className="text-sm text-gray-500">
                {block.extras?.pool?.name || "Unknown Pool"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {block.tx_count} txs
              </div>
              <div className="text-xs text-gray-500">
                {formatBTC(block.extras?.totalFees || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (bitcoinData.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Bitcoin data...</p>
        </div>
      </div>
    );
  }

  if (bitcoinData.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{bitcoinData.error}</p>
          <button
            onClick={fetchBitcoinData}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bitcoin Network Metrics
          </h1>
          <p className="text-gray-600">
            Real-time Bitcoin network statistics, mining metrics, and price data
          </p>
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <Clock size={16} className="mr-2" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Price Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Price Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Bitcoin Price (USD)"
              value={formatPrice(bitcoinData.price)}
              icon={DollarSign}
              color="bg-green-500"
              trend={bitcoinData.priceChange24h}
            />
            <StatCard
              title="24h Price Change"
              value={`${bitcoinData.priceChange24h?.toFixed(2)}%`}
              icon={BarChart3}
              color={
                bitcoinData.priceChange24h >= 0 ? "bg-green-500" : "bg-red-500"
              }
            />
          </div>
        </div>

        {/* Mining Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Mining Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Block Reward"
              value={`${bitcoinData.blockReward?.toFixed(4)} BTC`}
              icon={Award}
              color="bg-yellow-500"
              subtitle="Subsidy + Fees"
            />
            <StatCard
              title="Block Subsidy"
              value={`${bitcoinData.blockSubsidy} BTC`}
              icon={Pickaxe}
              color="bg-orange-500"
              subtitle="Fixed reward"
            />
            <StatCard
              title="Daily Mining Revenue"
              value={formatPrice(bitcoinData.totalMiningRevenue)}
              icon={Calculator}
              color="bg-green-600"
              subtitle="144 blocks/day"
            />
            <StatCard
              title="Mining Profitability"
              value={calculateMiningProfitability(
                bitcoinData.price,
                bitcoinData.difficulty,
                bitcoinData.hashrate
              )}
              icon={TrendingUp}
              color="bg-purple-500"
              subtitle="Estimated per TH/s"
            />
          </div>
        </div>

        {/* Network Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Network Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Current Block Height"
              value={formatNumber(bitcoinData.blockHeight)}
              icon={Blocks}
              color="bg-blue-500"
              subtitle="Latest block number"
            />
            <StatCard
              title="Network Hashrate"
              value={formatHashrate(bitcoinData.hashrate)}
              icon={Zap}
              color="bg-purple-500"
              subtitle="Mining power"
            />
            <StatCard
              title="Mining Difficulty"
              value={formatDifficulty(bitcoinData.difficulty)}
              icon={Activity}
              color="bg-indigo-500"
              subtitle="Current difficulty"
              trend={bitcoinData.difficultyChange}
            />
          </div>
        </div>

        {/* Difficulty Adjustment */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Difficulty Adjustment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Blocks Until Adjustment"
              value={formatNumber(bitcoinData.blocksUntilAdjustment)}
              icon={Clock}
              color="bg-cyan-500"
              subtitle="Remaining blocks"
            />
            <StatCard
              title="Estimated Difficulty Change"
              value={`${bitcoinData.difficultyChange?.toFixed(2)}%`}
              icon={TrendingUp}
              color={
                bitcoinData.difficultyChange >= 0
                  ? "bg-red-500"
                  : "bg-green-500"
              }
              subtitle="Next adjustment"
            />
            <StatCard
              title="Adjustment Date"
              value={
                bitcoinData.nextDifficultyAdjustment
                  ? new Date(
                      bitcoinData.nextDifficultyAdjustment * 1000
                    ).toLocaleDateString()
                  : "N/A"
              }
              icon={Clock}
              color="bg-teal-500"
              subtitle="Estimated"
            />
          </div>
        </div>

        {/* Mempool & Fees */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Mempool & Fees
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Mempool Size"
              value={formatNumber(bitcoinData.mempoolSize)}
              icon={Activity}
              color="bg-orange-500"
              subtitle="Pending transactions"
            />
            <StatCard
              title="Average Block Time"
              value={`${(bitcoinData.avgBlockTime / 60).toFixed(1)}m`}
              icon={Clock}
              color="bg-teal-500"
              subtitle="Last 144 blocks"
            />
            <StatCard
              title="Fast Fee Rate"
              value={`${bitcoinData.networkFeeRate} sat/vB`}
              icon={TrendingUp}
              color="bg-red-500"
              subtitle="Recommended fee"
            />
          </div>
        </div>

        {/* Mining Pools and Recent Blocks */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Mining Activity
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MiningPoolCard pools={bitcoinData.miningPools} />
            <RecentBlocksCard blocks={bitcoinData.recentBlocks} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Data provided by mempool.space and CoinGecko APIs</p>
          <p className="mt-2">Updates automatically every 30 seconds</p>
        </div>
      </div>
    </div>
  );
};

export default BitcoinMetrics;
