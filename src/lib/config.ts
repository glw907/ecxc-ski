import { parseSiteConfig, extractMenu } from '@glw907/cairn-cms';
import raw from './site.config.yaml?raw';

/** The site's canonical config, read from the git-committed YAML at build time. `parseSiteConfig`
 *  validates every top-level key against its known list, so site.config.yaml carries no
 *  site-specific extras (the sender identity and the footer copyright name are plain constants
 *  below instead). */
export const siteConfig = parseSiteConfig(raw);

export const SITE_TITLE       = siteConfig.siteName;
export const SITE_DESCRIPTION = siteConfig.description ?? '';
export const SITE_AUTHOR      = siteConfig.author ?? '';
export const SITE_LOCALE      = siteConfig.locale ?? 'en-US';
// The home page's featured-vs-archive split. Fixed at 1 (formerly settings.homepageFeaturedCount,
// which never carried a different value).
export const HOMEPAGE_FEATURED_COUNT = 1;
// The footer's copyright line (formerly the footer.copyrightName YAML key, no longer a
// recognized top-level key).
export const FOOTER_COPYRIGHT_NAME = 'East Community Cross Country';

/** The primary header navigation, read from the site config. */
export const PRIMARY_NAV = extractMenu(siteConfig, 'primary', 2);

// cairn-cms: the backend repo, and the editable concepts (their fields, permalink policy, and
// tag vocabulary sourcing) all live in the site adapter (`src/lib/cairn.config.ts`), behind
// cairn-core's CairnAdapter seam.
