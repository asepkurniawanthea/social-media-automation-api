export const SOURCE_CHANNELS = [
  'hardcode',
  '1001colors',
  'ngabring',
  'kangbadru',
] as const;

export type SourceChannel = (typeof SOURCE_CHANNELS)[number];
