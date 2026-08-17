import type { ReactNode } from 'react';

// third party
import { motion, useCycle } from 'framer-motion';

// ==============================|| ANIMATION BUTTON ||============================== //

type AnimationType = 'slide' | 'scale' | 'rotate';
type Direction = 'up' | 'down' | 'left' | 'right';

interface ScaleConfig {
  hover: number;
  tap: number;
}

interface AnimateButtonProps {
  children: ReactNode;
  type?: AnimationType;
  direction?: Direction;
  offset?: number;
  scale?: number | ScaleConfig;
}

const AnimateButton = ({
  children,
  type = 'scale',
  direction = 'right',
  offset = 10,
  scale = { hover: 1, tap: 0.9 }
}: AnimateButtonProps) => {
  let offset1: number;
  let offset2: number;

  switch (direction) {
    case 'up':
    case 'left':
      offset1 = offset;
      offset2 = 0;
      break;
    case 'right':
    case 'down':
    default:
      offset1 = 0;
      offset2 = offset;
      break;
  }

  const [x, cycleX] = useCycle(offset1, offset2);
  const [y, cycleY] = useCycle(offset1, offset2);

  const resolvedScale: ScaleConfig = typeof scale === 'number' ? { hover: scale, tap: scale } : scale;

  switch (type) {
    case 'rotate':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: 2,
            repeatDelay: 0
          }}
        >
          {children}
        </motion.div>
      );
    case 'slide':
      if (direction === 'up' || direction === 'down') {
        return (
          <motion.div animate={{ y: y !== undefined ? y : '' }} onHoverEnd={() => cycleY()} onHoverStart={() => cycleY()}>
            {children}
          </motion.div>
        );
      }
      return (
        <motion.div animate={{ x: x !== undefined ? x : '' }} onHoverEnd={() => cycleX()} onHoverStart={() => cycleX()}>
          {children}
        </motion.div>
      );

    case 'scale':
    default:
      return (
        <motion.div whileHover={{ scale: resolvedScale.hover }} whileTap={{ scale: resolvedScale.tap }}>
          {children}
        </motion.div>
      );
  }
};

export default AnimateButton;
