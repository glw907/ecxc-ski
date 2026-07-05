import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { load as homeLoad } from '../../routes/(site)/home/+page.server';
import { load as resourcesLoad } from '../../routes/(site)/resources/+page.server';

// The two sanctioned launch-time redirects (backlog #17, #18): both static routes outrank
// the [...path] catch-all for their exact path, so they 301 instead of rendering the
// duplicate Home page or 404ing on the retired Resources page.
describe('the two sanctioned redirects', () => {
  it('sends /home to the root', () => {
    try {
      homeLoad();
      expect.unreachable('load should have redirected');
    } catch (e) {
      expect(isRedirect(e)).toBe(true);
      if (isRedirect(e)) {
        expect(e.status).toBe(301);
        expect(e.location).toBe('/');
      }
    }
  });

  it('sends /resources to CrewLAB, where its waiver-and-forms content moved', () => {
    try {
      resourcesLoad();
      expect.unreachable('load should have redirected');
    } catch (e) {
      expect(isRedirect(e)).toBe(true);
      if (isRedirect(e)) {
        expect(e.status).toBe(301);
        expect(e.location).toBe('/crewlab');
      }
    }
  });
});
