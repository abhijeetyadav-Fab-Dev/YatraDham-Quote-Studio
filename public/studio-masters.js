// Labels remain quote snapshots; IDs only determine available new choices.
export function packageChoices(packages, subcategories, selectedLabel) {
  const label = String(selectedLabel || '').trim().toLowerCase();
  const subcategory = subcategories.find(x => x.v.toLowerCase() === label);
  return subcategory ? packages.filter(x => x.subcategoryId === subcategory.id) : packages;
}

export function findMaster(rows, label) {
  const value = String(label || '').trim().toLowerCase();
  return rows.find(x => x.v.toLowerCase() === value);
}