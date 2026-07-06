import { parseSiteConfig, extractMenu } from '@glw907/cairn-cms';
import raw from './site.config.yaml?raw';

// The 0.6 SiteConfig types every non-core top-level key as `unknown` through an index
// signature, so the EC-specific blocks (settings, email, footer) need a local typed view.
// These mirror the keys this site declares in site.config.yaml.
interface EcSettings {
  feedMaxItems?: number;
  homepageFeaturedCount?: number;
  postTags?: string[];
}
interface EcEmail {
  sender?: string;
  senderName?: string;
}
interface EcFooter {
  copyrightName?: string;
}

/** The site's canonical config, read from the git-committed YAML at build time (Pass L). */
export const siteConfig = parseSiteConfig(raw);

const settings = (siteConfig.settings ?? {}) as EcSettings;
/** Typed view of the site's email block (magic-link + contact sender identity). */
export const siteEmail = (siteConfig.email ?? {}) as EcEmail;
/** Typed view of the site's footer block. */
export const siteFooter = (siteConfig.footer ?? {}) as EcFooter;

export const SITE_URL                = siteConfig.url ?? '';
export const SITE_TITLE              = siteConfig.siteName;
export const SITE_DESCRIPTION        = siteConfig.description ?? '';
export const SITE_AUTHOR             = siteConfig.author ?? '';
export const SITE_LOCALE             = siteConfig.locale ?? 'en-US';
export const FEED_MAX_ITEMS          = settings.feedMaxItems ?? 20;
export const HOMEPAGE_FEATURED_COUNT = settings.homepageFeaturedCount ?? 1;

/** Controlled tag vocabulary for posts. Frontmatter tags outside this set fail the build. */
export const POST_TAGS: readonly string[] = settings.postTags ?? [];

/** The primary header navigation, read from the site config (Pass L). */
export const PRIMARY_NAV = extractMenu(siteConfig, 'primary', 2);

// cairn-cms: the backend repo and editable collections live in the site adapter
// (`src/lib/cairn.config.ts`), behind cairn-core's CairnAdapter seam (Pass D).
