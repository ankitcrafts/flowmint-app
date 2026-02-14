
import { motion } from "framer-motion";
import { Leaf, Wind, Droplets } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

const GREEN_DATA = [
  { name: "Mon", score: 65 },
  { name: "Tue", score: 59 },
  { name: "Wed", score: 80 },
  { name: "Thu", score: 81 },
  { name: "Fri", score: 56 },
  { name: "Sat", score: 55 },
  { name: "Sun", score: 40 },
];

interface SustainabilityCardProps {
  score?: number;
}

const SustainabilityCard = ({
  score = 72,
}: SustainabilityCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-[2.5rem] p-6 border theme-transition relative overflow-hidden group"
      style={{ borderColor: "var(--glass-border)" }}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Leaf size={120} className="text-green-500" />
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-5 h-5 text-green-400 fill-green-400/20" />
            <h3
              className="font-black text-lg tracking-tight"
              style={{ color: "var(--text-color)" }}
            >
              Eco Impact
            </h3>
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            Sustainability Score
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-black text-green-400">{score}</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            Good
          </span>
        </div>
      </div>

      <div className="flex gap-3 mb-6 relative z-10">
        <div className="flex-1 glass rounded-2xl p-3 flex flex-col items-center justify-center gap-2 border border-white/5 bg-green-500/5">
          <Wind className="w-5 h-5 text-green-300" />
          <span className="text-xs font-bold text-gray-400">-12kg</span>
          <span className="text-[9px] font-black uppercase text-gray-600">
            CO2 Saved
          </span>
        </div>
        <div className="flex-1 glass rounded-2xl p-3 flex flex-col items-center justify-center gap-2 border border-white/5 bg-blue-500/5">
          <Droplets className="w-5 h-5 text-blue-300" />
          <span className="text-xs font-bold text-gray-400">340L</span>
          <span className="text-[9px] font-black uppercase text-gray-600">
            Water Saved
          </span>
        </div>
      </div>

      <div className="h-24 w-[110%] -ml-4 relative z-0 opacity-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={GREEN_DATA}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass p-2 rounded-lg border border-white/10">
                      <p className="text-[10px] font-black text-green-400">
                        {payload[0].value} Score
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#4ade80"
              strokeWidth={3}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <button className="w-full mt-2 py-3 rounded-xl bg-green-500/10 text-green-400 font-bold text-xs uppercase hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2">
        View Green Insights <Leaf className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export default SustainabilityCard;
