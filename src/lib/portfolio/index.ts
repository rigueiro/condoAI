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
  ActiveCondominiumProvider,
  useActiveCondominium,
  buildingWorkspaceHref,
  isBuildingWorkspacePath,
  isBuildingWorkspaceTab,
  BUILDING_WORKSPACE_TABS,
  type BuildingWorkspaceTab,
} from "./active-condominium";
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
  parseDecimal,
  permillageSummary,
  roundPermillage,
  sumPermillage,
  unitsForCondominium,
  type PermillageSummary,
} from "./units";
export {
  OCCUPANCY_ROLES,
  indexOccupantsByUnitId,
  type OccupancyLink,
  type Occupant,
} from "./occupancy";
export {
  buildImportTemplateCsv,
  validateOwnersFractionsCsv,
  IMPORT_CSV_HEADERS,
  type ImportValidationResult,
  type ImportRowPreview,
} from "./csv-import";
export { readPortfolio } from "./storage";
