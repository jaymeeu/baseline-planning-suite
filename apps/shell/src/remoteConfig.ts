export interface BpsRemoteConfig {
  peopleRemoteUrl: string;
  deliveryRemoteUrl: string;
}

declare global {
  interface Window {
    __BPS_CONFIG__?: Partial<BpsRemoteConfig> | undefined;
  }
}

function isNonEmptyUrl(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Read runtime remote URLs from window.__BPS_CONFIG__ (set by /config.js).
 * Throws when required URLs are missing or empty.
 */
export function readRemoteConfig(
  source: Partial<BpsRemoteConfig> | undefined = typeof window !== 'undefined'
    ? window.__BPS_CONFIG__
    : undefined,
): BpsRemoteConfig {
  if (!source) {
    throw new Error(
      'Missing runtime config: window.__BPS_CONFIG__ is not defined. Ensure /config.js loads before the Shell app.',
    );
  }
  const peopleRemoteUrl = source.peopleRemoteUrl;
  const deliveryRemoteUrl = source.deliveryRemoteUrl;
  if (!isNonEmptyUrl(peopleRemoteUrl) || !isNonEmptyUrl(deliveryRemoteUrl)) {
    throw new Error(
      'Invalid runtime config: peopleRemoteUrl and deliveryRemoteUrl must be non-empty strings.',
    );
  }
  return {
    peopleRemoteUrl: peopleRemoteUrl.trim(),
    deliveryRemoteUrl: deliveryRemoteUrl.trim(),
  };
}
