import type { DefectType, Severity, Status } from './types';

export const DEFECT_TYPES: DefectType[] = [
  'Weave Defect',
  'Shade Variation',
  'Hole/Tear',
  'Count Deviation',
  'Other',
];

export const SEVERITIES: Severity[] = ['Critical', 'Major', 'Minor'];

export const STATUSES: Status[] = ['Open', 'Resolved'];
