export interface MasterChoice { id: number; v: string; subcategoryId?: number | null }
export function packageChoices(packages: MasterChoice[], subcategories: MasterChoice[], selectedLabel: string): MasterChoice[];
export function findMaster(rows: MasterChoice[], label: string): MasterChoice | undefined;