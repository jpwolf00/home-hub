'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useReducedMotion } from '@/components/hooks/useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Animation variants with accessibility support
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for smooth feel
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Reduced motion variant for accessibility
const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion ? reducedMotionVariants : pageVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        // Ensure keyboard navigation works properly
        tabIndex={-1}
        className="outline-none"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
