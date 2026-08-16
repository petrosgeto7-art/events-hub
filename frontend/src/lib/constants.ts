export const APP_NAME = 'EventHub DBU';
export const APP_VERSION = '1.1.0';

export const UNIVERSITY_INFO = {
  name: 'Debre Birhan University',
  shortName: 'DBU',
  city: 'Debre Birhan',
  country: 'Ethiopia',
  coordinates: {
    lat: 9.6833,
    lng: 39.5333,
  },
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  PAGE_SIZE: 12,
} as const;
