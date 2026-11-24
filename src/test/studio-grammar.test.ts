import { describe, expect, it } from 'vitest';
import { localFix } from '../../public/studio-grammar.js';

describe('instant travel spelling corrections', () => {
  it('corrects Guarat to Gujarat in package titles', () => {
    expect(localFix('8 Days / 7 Nights Guarat Tour')).toBe('8 Days / 7 Nights Gujarat Tour');
  });
  it('corrects multiple Gujarat spelling variations', () => {
    expect(localFix('Gujrat, Gujarath, Gujurat, Guarat')).toBe('Gujarat, Gujarat, Gujarat, Gujarat');
  });
  it('corrects Stewell to Stepwell', () => {
    expect(localFix('Explore Adalaj Stewell.')).toBe('Explore Adalaj Stepwell.');
  });
  it('corrects Kakaria to Kankaria', () => {
    expect(localFix('Explore Kakaria Lake or the local market.')).toBe('Explore Kankaria Lake or the local market.');
  });
  it('preserves itinerary lines, dates, prices and valid place names', () => {
    expect(localFix('Visit Sabarmati Ashram.\nExplore Adalaj Stewell.\nExplore Kakaria Lake.\n13/11/2026: Rs. 2500'))
      .toBe('Visit Sabarmati Ashram.\nExplore Adalaj Stepwell.\nExplore Kankaria Lake.\n13/11/2026: Rs. 2500');
  });
});