// Low Power Mode detection and utilities

export const isLowPowerMode = (): boolean => {
  if (typeof process !== 'undefined') {
    return process.env.NEXT_PUBLIC_LOW_POWER === 'true';
  }
  return false;
};

export const getRefreshInterval = (baseMinutes: number): number => {
  return isLowPowerMode() ? baseMinutes * 2 : baseMinutes;
};

export const shouldAnimate = (): boolean => {
  return !isLowPowerMode();
};
