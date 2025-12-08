// Utils/debounce.js
// Debounce and throttle utilities

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const debounceAsync = async (func, wait) => {
  let timeout;
  return function (...args) {
    return new Promise((resolve) => {
      const later = async () => {
        clearTimeout(timeout);
        const result = await func(...args);
        resolve(result);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    });
  };
};
