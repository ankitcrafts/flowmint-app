import type { FC } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════
// Skeleton Loader — Premium Shimmer Effect
// ═══════════════════════════════════════════════════

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export const Skeleton: FC<SkeletonProps> = ({ className = '', width, height, rounded = 'rounded-2xl' }) => (
  <motion.div
    className={`relative overflow-hidden ${rounded} ${className}`}
    style={{
      width: width || '100%',
      height: height || '1rem',
      backgroundColor: 'var(--card-subtle)',
    }}
    animate={{ opacity: [0.3, 0.6, 0.3] }}
    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
  >
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      }}
      animate={{ x: ['-100%', '100%'] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
    />
  </motion.div>
);

// ═══════════════════════════════════════════════════
// Card Skeleton — For Dashboard Widgets
// ═══════════════════════════════════════════════════

export const CardSkeleton: FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div
    className="rounded-[2rem] p-6 border"
    style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}
  >
    <Skeleton height="0.75rem" width="40%" className="mb-4" />
    <Skeleton height="1.5rem" width="60%" className="mb-4" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="0.625rem"
        width={`${70 + Math.random() * 30}%`}
        className="mb-2"
      />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════
// List Item Skeleton — For Transactions, Bills, etc.
// ═══════════════════════════════════════════════════

export const ListItemSkeleton: FC = () => (
  <div
    className="flex items-center gap-4 p-4 rounded-[1.8rem] border"
    style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}
  >
    <Skeleton width="2.5rem" height="2.5rem" rounded="rounded-xl" />
    <div className="flex-1">
      <Skeleton height="0.75rem" width="60%" className="mb-2" />
      <Skeleton height="0.5rem" width="30%" />
    </div>
    <Skeleton width="3.5rem" height="0.875rem" />
  </div>
);

// ═══════════════════════════════════════════════════
// List Skeleton — Staggered Multiple Items
// ═══════════════════════════════════════════════════

export const ListSkeleton: FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
      >
        <ListItemSkeleton />
      </motion.div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════
// Chart Skeleton — For Recharts Placeholders
// ═══════════════════════════════════════════════════

export const ChartSkeleton: FC<{ height?: string }> = ({ height = '12rem' }) => (
  <div
    className="rounded-[2rem] p-6 border"
    style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}
  >
    <Skeleton height="0.75rem" width="35%" className="mb-6" />
    <div className="flex items-end gap-2" style={{ height }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton
          key={i}
          width="100%"
          height={`${20 + Math.random() * 80}%`}
          rounded="rounded-t-lg"
        />
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// Balance Skeleton — Large Number Placeholder
// ═══════════════════════════════════════════════════

export const BalanceSkeleton: FC = () => (
  <div
    className="rounded-[2.5rem] p-8 border text-center"
    style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}
  >
    <Skeleton height="0.625rem" width="30%" className="mx-auto mb-4" />
    <Skeleton height="2.5rem" width="65%" className="mx-auto mb-3" />
    <Skeleton height="0.5rem" width="45%" className="mx-auto" />
  </div>
);

// ═══════════════════════════════════════════════════
// Stats Grid Skeleton — For Dashboard Mini-Widgets
// ═══════════════════════════════════════════════════

export const StatsGridSkeleton: FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.08 }}
      >
        <CardSkeleton lines={1} />
      </motion.div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════
// Empty State — When No Data Exists
// ═══════════════════════════════════════════════════

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-12 px-8 text-center"
  >
    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-gray-500"
         style={{ backgroundColor: 'var(--card-subtle)' }}>
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-color)' }}>{title}</h3>
    <p className="text-sm opacity-50 mb-4 max-w-xs" style={{ color: 'var(--text-color)' }}>{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-2.5 mint-gradient rounded-2xl text-black text-sm font-bold shadow-lg"
        style={{ boxShadow: '0 4px 15px var(--brand-glow)' }}
      >
        {action.label}
      </button>
    )}
  </motion.div>
);

export default Skeleton;
