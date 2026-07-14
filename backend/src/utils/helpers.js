/**
 * Round a number to 2 decimal places.
 */
export const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * Generate a unique order number in format ORD-YYYYMMDD-XXXXX.
 */
export const generateOrderNumber = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = String(Math.floor(10000 + Math.random() * 90000));
  return `ORD-${datePart}-${randomPart}`;
};
