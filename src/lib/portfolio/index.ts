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
  buildCollectionFromPortfolio,
  breakdownFromStats,
  collectionSummaryForCondo,
  condoStats,
  condoStatsFromOwners,
  ownersByCondoId,
  ownersForCondo,
  summarizeCollection,
  labelCommonAreas,
  formatPortugueseAddress,
  portfolioToOwnerViews,
  COMMON_AREA_LABELS,
  BUILDING_TYPES,
  CONDOMINIUM_STATUSES,
  buildingTypeI18nKey,
  condominiumStatusI18nKey,
  type CondoStats,
  type CollectionSummaryData,
  type CollectionBreakdown,
} from "./mappers";
export {
  buildImportTemplateCsv,
  validateOwnersFractionsCsv,
  IMPORT_CSV_HEADERS,
  type ImportValidationResult,
  type ImportRowPreview,
} from "./csv-import";
export { readPortfolio } from "./storage";
