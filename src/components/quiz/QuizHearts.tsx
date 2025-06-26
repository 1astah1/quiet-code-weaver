import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const QuizHearts = ({ hearts }: { hearts: number }) => {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-2">
      <div className="flex">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 1 }}
            animate={{ scale: i < hearts ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Heart
              className={`h-7 w-7 ${i < hearts ? 'text-red-500 fill-current' : 'text-slate-600'}`}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuizHearts; 