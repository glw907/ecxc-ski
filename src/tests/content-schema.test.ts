import { describe, it, expect } from 'vitest';
import { cairn } from '$lib/cairn.config';

// The per-field validators live on the concept's fieldset (defineConcept/fieldset/fields), the
// Contract v2 adapter shape. What survives from the old defineFields-era test is the one
// site-specific contract the adapter still owns: the posts `tags` field is a vocabulary-sourced
// taxonomy field (site.config.yaml's `vocabulary` list supplies its options), and the dated
// permalink policy the URL-inventory test depends on.
describe('posts concept', () => {
  it('declares the tags field as a creatable taxonomy multiselect', () => {
    const tagsField = cairn.content.posts?.fields.fields.tags;
    expect(tagsField?.type).toBe('multiselect');
    if (tagsField?.type === 'multiselect') {
      expect(tagsField.taxonomy).toBe(true);
      expect(tagsField.creatable).toBe(true);
    }
  });

  it('declares the month-granularity dated permalink', () => {
    expect(cairn.content.posts?.permalink).toBe('/:year/:month/:slug');
    expect(cairn.content.posts?.datePrefix).toBe('month');
  });
});
