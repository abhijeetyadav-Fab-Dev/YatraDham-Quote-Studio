import { describe, expect, it } from 'vitest';
import { packageChoices, findMaster } from '../../public/studio-masters.js';

const subcategories = [{ id: 1, v: 'Gujarat Tour Package' }, { id: 2, v: 'Rajasthan Tour Package' }];
const packages = [
  { id: 10, v: 'Dwarka to Somnath Car Trip', subcategoryId: 1 },
  { id: 11, v: 'Jaipur Car Trip', subcategoryId: 2 },
  { id: 12, v: 'Legacy Package', subcategoryId: null },
];

describe('central package choices', () => {
  it('only offers packages linked to the chosen subcategory', () => {
    expect(packageChoices(packages, subcategories, 'Gujarat Tour Package').map(x => x.id)).toEqual([10]);
  });
  it('keeps all choices available for a legacy or unset subcategory without changing the saved label', () => {
    expect(packageChoices(packages, subcategories, 'Stay and transport package')).toEqual(packages);
    expect(packageChoices(packages, subcategories, '')).toEqual(packages);
  });
  it('recognizes a central value regardless of surrounding whitespace or capitalization', () => {
    expect(findMaster(subcategories, ' gujarat TOUR package ')?.id).toBe(1);
    expect(findMaster(subcategories, 'Other')).toBeUndefined();
  });
});