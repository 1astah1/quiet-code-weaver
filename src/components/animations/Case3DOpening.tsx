
import React from 'react';
import { motion } from 'framer-motion';

const Case3DOpening = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        initial={{ rotateY: 0, scale: 1 }}
        animate={{ 
          rotateY: [0, 180, 360], 
          scale: [1, 1.1, 1] 
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-2xl flex items-center justify-center"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        <div className="text-white text-2xl font-bold">📦</div>
      </motion.div>
    </div>
  );
};

export default Case3DOpening;
