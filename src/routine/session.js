// Routine session: a DOM-free, audio-free timer state machine.
// The view reacts to the callbacks; this module only knows about steps (see generator.js) and time.
//
// Timing is deadline-based (performance.now), not a counted setInterval, so
// throttled/backgrounded tabs and slow ticks never make the routine drift.

const TICK_MS = 250;

export class RoutineSession {
  /**
   * @param {object} handlers
   * @param {(sec:number, step:object)=>void} handlers.onTick       whole-second change inside a step
   * @param {(step:object, prev:object|null, reason:string)=>void} handlers.onStepChange
   *        reason: 'auto' | 'next' | 'prev' | 'restart' | 'skip-phase'
   * @param {()=>void} handlers.onComplete
   */
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.steps = [];
    this.stepIndex = 0;
    this.running = false;
    this.paused = false;
    this._remainingMs = 0; // authoritative while paused / not running
    this._deadline = 0;    // performance.now() timestamp while running
    this._timer = null;
    this._lastSec = 0;
  }

  get currentStep() {
    return this.steps[this.stepIndex] || null;
  }

  get totalSec() {
    return this.steps.reduce((acc, step) => acc + step.duration, 0);
  }

  get remainingMs() {
    if (this.running && !this.paused) return Math.max(0, this._deadline - performance.now());
    return this._remainingMs;
  }

  /** Whole seconds left in the current step (what the big timer shows) */
  get remainingSec() {
    return Math.ceil(this.remainingMs / 1000);
  }

  /** Seconds elapsed over the whole routine */
  get elapsedSec() {
    if (!this.running) return 0;
    let done = 0;
    for (let i = 0; i < this.stepIndex; i++) done += this.steps[i].duration;
    const step = this.currentStep;
    return done + (step ? step.duration - this.remainingMs / 1000 : 0);
  }

  /** Seconds left over the whole routine */
  get totalRemainingSec() {
    return Math.max(0, this.totalSec - this.elapsedSec);
  }

  setSteps(steps) {
    this.steps = steps;
  }

  start() {
    if (this.running || this.steps.length === 0) return false;
    this.stepIndex = 0;
    this.running = true;
    this.paused = false;
    this._enterStep(0);
    this._timer = setInterval(() => this._tick(), TICK_MS);
    return true;
  }

  pause() {
    if (!this.running || this.paused) return;
    this._remainingMs = this.remainingMs;
    this.paused = true;
  }

  resume() {
    if (!this.running || !this.paused) return;
    this._deadline = performance.now() + this._remainingMs;
    this.paused = false;
  }

  stop() {
    clearInterval(this._timer);
    this._timer = null;
    this.running = false;
    this.paused = false;
    this.stepIndex = 0;
    this._remainingMs = 0;
  }

  next() {
    if (!this.running) return;
    this._goTo(this.stepIndex + 1, 'next');
  }

  /** Restart the current step if it is well under way, otherwise go back one step */
  prev() {
    if (!this.running) return;
    const step = this.currentStep;
    const intoStepSec = step.duration - this.remainingMs / 1000;
    if (intoStepSec > 3 || this.stepIndex === 0) {
      this._goTo(this.stepIndex, 'restart');
    } else {
      this._goTo(this.stepIndex - 1, 'prev');
    }
  }

  skipPhase() {
    if (!this.running) return;
    const phaseIndex = this.currentStep.phaseIndex;
    const idx = this.steps.findIndex((s, i) => i > this.stepIndex && s.phaseIndex !== phaseIndex);
    this._goTo(idx === -1 ? this.steps.length : idx, 'skip-phase');
  }

  // --- internals -----------------------------------------------------------

  _enterStep(index, carryMs = 0) {
    this.stepIndex = index;
    const durationMs = this.steps[index].duration * 1000;
    this._remainingMs = durationMs;
    this._deadline = performance.now() + durationMs - carryMs;
    this._lastSec = this.steps[index].duration;
  }

  _goTo(index, reason, carryMs = 0) {
    if (index >= this.steps.length) {
      this._complete();
      return;
    }
    const prev = this.currentStep;
    this._enterStep(index, carryMs);
    // Entering a step while paused must not start the clock
    if (this.paused) this._remainingMs = this.steps[index].duration * 1000;
    this.handlers.onStepChange?.(this.currentStep, prev, reason);
  }

  _complete() {
    this.stop();
    this.handlers.onComplete?.();
  }

  _tick() {
    if (!this.running || this.paused) return;

    // Step expired? Carry the overshoot so a throttled tab catches up instead of drifting.
    let overshoot = performance.now() - this._deadline;
    if (overshoot >= 0) {
      let index = this.stepIndex + 1;
      while (index < this.steps.length && overshoot >= this.steps[index].duration * 1000) {
        overshoot -= this.steps[index].duration * 1000;
        index++;
      }
      this._goTo(index, 'auto', index < this.steps.length ? overshoot : 0);
      return;
    }

    const sec = this.remainingSec;
    if (sec !== this._lastSec) {
      this._lastSec = sec;
      this.handlers.onTick?.(sec, this.currentStep);
    }
  }
}
