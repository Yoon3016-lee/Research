import "server-only";

export type { KsicEntry, KsicDetailPreview } from "@/lib/ksic-types";
export {
  searchKsicDb as searchKsic,
  lookupKsicDb as lookupKsic,
  listKsicChildrenDb as listKsicChildren,
  getKsicDetailDb as getKsicDetail,
  formatKsicContextDb as formatKsicContext,
} from "@/lib/ksic-db";
