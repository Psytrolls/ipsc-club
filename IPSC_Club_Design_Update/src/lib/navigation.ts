/**
 * Navigation links for shooting range (Waze, Google Maps, Apple Maps)
 */
export const DEFAULT_RANGE_LOCATION = 'מטווח נץ המדבר, מתחם מול 7, שדרות';

export const DEFAULT_WAZE_URL = 'https://waze.com/ul?q=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%A0%D7%A5+%D7%94%D7%9E%D7%93%D7%91%D7%A8+%D7%A9%D7%93%D7%A8%D7%95%D7%AA&navigate=yes';

export const DEFAULT_GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%A0%D7%A5+%D7%94%D7%9E%D7%93%D7%91%D7%A8+%D7%A9%D7%93%D7%A8%D7%95%D7%AA';

export function getWazeNavigationUrl(customLocation?: string): string {
  if (!customLocation || customLocation.includes('נץ המדבר')) {
    return DEFAULT_WAZE_URL;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(customLocation)}&navigate=yes`;
}

export function getGoogleMapsNavigationUrl(customLocation?: string): string {
  if (!customLocation || customLocation.includes('נץ המדבר')) {
    return DEFAULT_GOOGLE_MAPS_URL;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customLocation)}`;
}
