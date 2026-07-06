import { describe, it, expect } from 'vitest';
import { cairn } from '$lib/cairn.config';
import { POST_TAGS } from '$lib/config';

// The per-field validators moved into the engine's defineFields/validate-once, so the old
// validatePostFrontmatter/validatePageFrontmatter tests are gone. What survives is the one
// site-specific contract the adapter still owns: the posts `tags` field carries the controlled
// vocabulary. This guards that the field declaration stays wired to POST_TAGS.
describe('posts schema', () => {
  it('declares the tags field with the controlled vocabulary', () => {
    const tagsField = cairn.content.posts?.schema.fields.find((f) => f.name === 'tags');
    expect(tagsField?.type).toBe('tags');
    if (tagsField?.type === 'tags') expect(tagsField.options).toEqual(POST_TAGS);
  });
});
