export type {
  OnboardingStep,
  Portfolio,
} from "./types";
export {
  EMPTY_PORTFOLIO,
  isOnboardingComplete,
  needsOnboarding,
} from "./types";
export { PortfolioProvider, usePortfolio } from "./portfolio-provider";
export {
  buildEmptyCondominium,
  buildEmptyOwner,
  buildCollectionFromPortfolio,
  breakdownFromStats,
  collectionSummaryForCondo,
  condoStats,
  condoStatsFromOwners,
  ownersByCondoId,
  ownersForCondo,
  ownerDisplay,
  ownerFromFormSave,
  portfolioToOwnerRows,
  resolveOrCreateUnit,
  summarizeCollection,
  labelCommonAreas,
  formatPortugueseAddress,
  COMMON_AREA_LABELS,
  BUILDING_TYPES,
  CONDOMINIUM_STATUSES,
  buildingTypeI18nKey,
  condominiumStatusI18nKey,
  type CondoStats,
  type CollectionSummaryData,
  type CollectionBreakdown,
  type OwnerDisplay,
} from "./mappers";
export {
  UNIT_TYPES,
  TOTAL_PERMILLAGE,
  PERMILLAGE_TOLERANCE,
  buildEmptyUnit,
  compareUnits,
  formatPermillage,
  indexOwnersByUnitId,
  parseDecimal,
  permillageSummary,
  roundPermillage,
  sumPermillage,
  unitsForCondominium,
  type PermillageSummary,
} from "./units";
export {
  buildImportTemplateCsv,
  validateOwnersFractionsCsv,
  IMPORT_CSV_HEADERS,
  type ImportValidationResult,
  type ImportRowPreview,
} from "./csv-import";
export { readPortfolio } from "./storage";
