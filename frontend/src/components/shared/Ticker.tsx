import { motion } from 'framer-motion';

interface TickerProps {
  items: string[];
}

export default function Ticker({ items }: TickerProps) {
  const text = items.join('    •    ');
  return (
    <div className="bg-green text-white overflow-hidden py-1.5 text-xs font-medium">
      <motion.div
        className="whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      >
        <span>{text}    •    {text}    •    </span>
      </motion.div>
    </div>
  );
}
