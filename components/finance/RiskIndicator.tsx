import React from 'react';
import { motion } from 'framer-motion';

type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

interface RiskIndicatorProps {
  level: RiskLevel;
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ level }) => {
  const configs = {
    Low:      { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', icon: '✅' },
    Moderate: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: '⚠️' },
    High:     { color: 'bg-orange-500/20 text-orange-400 border-orange-500/50', icon: '🔥' },
    Critical: { color: 'bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]', icon: '🚨' },
  };

  const config = configs[level] || configs.Low;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wider uppercase ${config.color}`}
    >
      <span>{config.icon}</span>
      <span>{level} Risk</span>
    </motion.div>
  );
};

export default RiskIndicator;
