// Screen Wake Lock API service to prevent phone sleep during bedtime workout
class WakeLockService {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
    
    // Automatically reacquire wake lock if user switches back to the tab
    if (this.isSupported) {
      document.addEventListener('visibilitychange', async () => {
        if (this.wakeLock !== null && document.visibilityState === 'visible') {
          await this.requestLock();
        }
      });
    }
  }

  async requestLock() {
    if (!this.isSupported) return false;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => {
        // Lock released
      });
      return true;
    } catch (err) {
      console.warn('Wake lock request failed:', err);
      return false;
    }
  }

  async releaseLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
      } catch (err) {
        console.warn('Wake lock release error:', err);
      }
    }
  }
}

export const wakeLockService = new WakeLockService();
