import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if a URL uses a safe protocol (http or https).
 */
export function isValidUrl(url: string | null | undefined): boolean {
  // ✅ Security: Cap URL length to prevent DoS via extremely long strings
  if (!url || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates if an image URL uses a safe protocol (http, https, or data).
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  // ✅ Security: Cap URL length to prevent DoS via extremely long strings
  if (!url || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'data:';
  } catch {
    // data: URLs might fail new URL() if they are large or malformed in some environments,
    // but in modern browsers/Node it should work.
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:');
  }
}

/**
 * ⚡ Bolt Optimization: Efficient date formatting (YYYY-MM-DD) that avoids the heavy Intl API.
 */
export function formatSimpleDate(item: string | Date | undefined): string | null {
  if (!item) return null;
  const d = new Date(item);
  if (isNaN(d.getTime())) return null;

  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/**
 * ⚡ Bolt Optimization: Efficient date-time formatting (YYYY-MM-DD HH:MM:SS) that avoids the heavy Intl API.
 */
export function formatFullDateTime(item: string | Date | undefined): string | null {
  if (!item) return null;
  const d = new Date(item);
  if (isNaN(d.getTime())) return null;

  const date = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');

  const time = String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0');

  return `${date} ${time}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * ⚡ Bolt Optimization: Efficient long date formatting (Month DD, YYYY) that avoids the heavy Intl API.
 */
export function formatLongDate(item: string | Date | undefined): string | null {
  if (!item) return null;
  const d = new Date(item);
  if (isNaN(d.getTime())) return null;

  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
