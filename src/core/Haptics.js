// Tiny haptic feedback wrapper. No-ops gracefully when the device doesn't
// support navigator.vibrate (desktop, iOS Safari without permission, etc.).

const can = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export const Haptics = {
  hit()    { if (can) navigator.vibrate(15); },
  damage() { if (can) navigator.vibrate(40); },
  level()  { if (can) navigator.vibrate([10, 50, 10, 50, 10]); },
  death()  { if (can) navigator.vibrate(200); },
  pickup() { if (can) navigator.vibrate(8); },
  boss()   { if (can) navigator.vibrate([0, 30, 30, 80]); },
};
