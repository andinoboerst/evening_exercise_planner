// Screen Wake Lock API service to prevent phone sleep during bedtime workout
class WakeLockService {
  constructor() {
    this.wakeLock = null;
    this.wanted = false; // true between requestLock() and releaseLock()
    this.isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

    // The browser drops the lock whenever the tab is hidden; re-acquire it on return
    if (this.isSupported) {
      document.addEventListener('visibilitychange', () => {
        if (this.wanted && document.visibilityState === 'visible' && !this.wakeLock) {
          this._acquire();
        }
      });
    }
  }

  get isActive() {
    return Boolean(this.wakeLock);
  }

  async _acquire() {
    try {
      const lock = await navigator.wakeLock.request('screen');
      // releaseLock() may have been called while the request was in flight
      if (!this.wanted) {
        await lock.release().catch(() => {});
        return false;
      }
      this.wakeLock = lock;
      lock.addEventListener('release', () => {
        if (this.wakeLock === lock) this.wakeLock = null;
        this.onChange?.(false);
      });
      this.onChange?.(true);
      return true;
    } catch (err) {
      console.warn('Wake lock request failed:', err);
      return false;
    }
  }

  async requestLock() {
    this.wanted = true;
    if (!this.isSupported) return false;
    if (this.wakeLock) return true;
    return this._acquire();
  }

  async releaseLock() {
    this.wanted = false;
    const lock = this.wakeLock;
    this.wakeLock = null;
    if (lock) {
      try {
        await lock.release();
      } catch (err) {
        console.warn('Wake lock release error:', err);
      }
    }
  }
}

export const wakeLockService = new WakeLockService();
