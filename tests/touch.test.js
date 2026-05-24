// Joystick math + button-hit detection.
//
// We don't simulate real touch events here; we directly poke the Touch module's
// state and assert its derived outputs. The actual event bindings are tested
// in-browser by playing the game.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Touch, BUTTON_LAYOUT, JOY_MAX_R } from '../src/core/Touch.js';
import { Input } from '../src/core/Input.js';

function makeStubCanvas(w = 800, h = 600) {
  return {
    width: w, height: h,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('Touch.joyVec', () => {
  it('returns 0,0 with no joystick active', () => {
    const t = new Touch(makeStubCanvas(), new Input());
    expect(t.joyVec()).toEqual({ x: 0, y: 0 });
  });

  it('returns 0,0 inside the deadzone', () => {
    const t = new Touch(makeStubCanvas(), new Input());
    t.joystick = { id: 1, baseX: 100, baseY: 100, x: 103, y: 103 };
    const v = t.joyVec();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('returns a normalized vector when pushed past deadzone', () => {
    const t = new Touch(makeStubCanvas(), new Input());
    t.joystick = { id: 1, baseX: 100, baseY: 100, x: 100 + JOY_MAX_R, y: 100 };
    const v = t.joyVec();
    expect(v.x).toBeCloseTo(1, 2);
    expect(v.y).toBeCloseTo(0, 2);
  });

  it('clamps magnitude to 1 when pushed past max radius', () => {
    const t = new Touch(makeStubCanvas(), new Input());
    t.joystick = { id: 1, baseX: 100, baseY: 100, x: 100 + JOY_MAX_R * 4, y: 100 };
    const v = t.joyVec();
    expect(Math.hypot(v.x, v.y)).toBeLessThanOrEqual(1.001);
  });

  it('45° push yields ~0.7,0.7', () => {
    const t = new Touch(makeStubCanvas(), new Input());
    const d = JOY_MAX_R / Math.SQRT2;
    t.joystick = { id: 1, baseX: 100, baseY: 100, x: 100 + d, y: 100 + d };
    const v = t.joyVec();
    expect(v.x).toBeCloseTo(Math.SQRT1_2, 2);
    expect(v.y).toBeCloseTo(Math.SQRT1_2, 2);
  });
});

describe('button hit detection', () => {
  let t;
  beforeEach(() => {
    t = new Touch(makeStubCanvas(800, 600), new Input());
    t.layout(800, 600);
  });

  it('positions buttons on the right side', () => {
    for (const btn of t.buttons) {
      expect(btn.x).toBeGreaterThan(400);
    }
  });

  it('buttonAt finds the sword button at its center', () => {
    const sword = t.buttons.find(b => b.action === 'attack');
    const hit = t.buttonAt(sword.x, sword.y);
    expect(hit?.action).toBe('attack');
  });

  it('buttonAt returns null in empty space', () => {
    expect(t.buttonAt(400, 300)).toBeNull();
  });
});
