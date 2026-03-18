# ADDON_COVER_TRANSLATION — Future Fix: translationId Linkage

## Summary

`ADDON_COVER_TRANSLATION` is currently treated as a **book-level addon** (no `translationId`), while all other translation-scoped addons (`ADDON_AUDIOBOOK`, `ADDON_AMAZON_STANDARD`, `ADDON_AMAZON_PREMIUM`) are linked to a specific translation via `translationId`. This inconsistency causes cover translation addons to not appear in translation-specific UI contexts (e.g., the translations collapsible in "My Books").

## How This Was Discovered

While implementing addon icons in the book listing's translations collapsible (March 2026), we found that `ADDON_COVER_TRANSLATION` addons have `translationId: null` in the database. The collapsible filters addons by `translationId === translation.id`, so cover translation icons never appear for any translation.

Investigation traced the issue to this line in `author-journey.tsx` (around line 492):

```typescript
// Cover translation is always a book-level addon (not tied to a specific translation)
if (translationId && selectedAddon.kind !== ProductKind.ADDON_COVER_TRANSLATION) {
  params.translationId = translationId;
}
```

This explicitly **excludes** `ADDON_COVER_TRANSLATION` from receiving `translationId` when requested from a translation context. The comment indicates this was an intentional design decision at the time.

Additionally, in the bundle flow (`addon.service.ts` → `hooks.service.ts`), when `ADDON_TRANSLATION` completes and sibling addons are linked to the new `translationId`, `ADDON_COVER_TRANSLATION` **is** included in the linkage:

```typescript
const siblingAddons = await this.prisma.bookAddon.findMany({
  where: {
    bookId: dto.bookId,
    kind: { in: [...PUBLISHING_KINDS, ProductKind.ADDON_COVER_TRANSLATION] },
    translationId: null,
    status: { notIn: [AddonStatus.CANCELLED, AddonStatus.ERROR] },
  },
});
```

So bundles **do** link cover translation to the translation, but individual requests **don't**. This creates inconsistent data depending on how the addon was purchased.

## Current Behavior

### Individual request (from translation view in author journey):
- User clicks "Translate Cover" on a translated book
- Frontend sends `{ kind: 'ADDON_COVER_TRANSLATION', params: { targetLanguage: 'es' } }` — **no translationId**
- Backend creates `BookAddon` with `translationId: null`
- The cover file is stored as `cover-translated-es.png` (matched by language, not by translation ID)

### Bundle request (Global Launch bundle):
- User buys bundle → `ADDON_COVER_TRANSLATION` created with `translationId: null`
- When `ADDON_TRANSLATION` completes → hook links sibling addons → cover translation gets `translationId`
- ✅ Correctly linked

### Regeneration:
- User regenerates a cover translation
- Goes through individual request path → `translationId: null` again
- ❌ Loses the linkage even if the original was linked via bundle

## Impact of the Current State

1. **Translations collapsible in "My Books"**: Cover translation icon (Palette cyan) does not appear for translations where the addon was created individually (most cases). Only bundle-created cover translations show the icon.

2. **`getExistingAddon` in author journey**: For translation-scoped views, `TRANSLATION_SCOPED_KINDS` includes `ADDON_AUDIOBOOK`, `ADDON_AMAZON_STANDARD`, `ADDON_AMAZON_PREMIUM` but **not** `ADDON_COVER_TRANSLATION`. This means all translation views show the same cover translation addon regardless of which translation context you're in.

3. **Admin publication detail**: The cover selection for translations works by matching `fileName.includes(targetLanguage)`, not by `translationId`. So it works despite the missing linkage — but it's fragile.

4. **Multiple translations of same language**: If a book had two Spanish translations (unlikely but possible), the cover translation would appear in both since it's matched by language, not by translation ID.

## Proposed Fix

### Step 1: Frontend — Remove the exclusion (1 line change)

In `apps/web/src/components/book/author-journey.tsx`, change:

```typescript
// BEFORE:
if (translationId && selectedAddon.kind !== ProductKind.ADDON_COVER_TRANSLATION) {
  params.translationId = translationId;
}

// AFTER:
if (translationId) {
  params.translationId = translationId;
}
```

Remove the comment about "book-level addon" as it will no longer be accurate.

### Step 2: Frontend — Add to TRANSLATION_SCOPED_KINDS

In `author-journey.tsx`, add `ADDON_COVER_TRANSLATION` to the `TRANSLATION_SCOPED_KINDS` set:

```typescript
const TRANSLATION_SCOPED_KINDS = new Set([
  ProductKind.ADDON_AUDIOBOOK,
  ProductKind.ADDON_AMAZON_STANDARD,
  ProductKind.ADDON_AMAZON_PREMIUM,
  ProductKind.ADDON_COVER_TRANSLATION, // ADD THIS
]);
```

This ensures `getExistingAddon` filters cover translations by the current translation context.

### Step 3: Backend — No changes needed

The `request()` method in `addon.service.ts` already handles `translationId` from `dto.params` for all addon types. The bookContext enrichment for translations (fetching translated title/chapters) also already works for `ADDON_COVER_TRANSLATION`.

### Step 4: Data migration (optional)

For existing cover translation addons without `translationId`, run a one-time migration script:

```sql
-- Link ADDON_COVER_TRANSLATION addons to the matching translation by language
-- This matches the cover file name pattern (cover-translated-{lang}.png) to translations
UPDATE book_addons ba
SET translation_id = bt.id
FROM book_translations bt
WHERE ba.book_id = bt.book_id
  AND ba.kind = 'ADDON_COVER_TRANSLATION'
  AND ba.translation_id IS NULL
  AND ba.status != 'ERROR'
  AND ba.status != 'CANCELLED'
  AND bt.status != 'ERROR'
  -- Match by checking if a cover file exists for this language
  AND EXISTS (
    SELECT 1 FROM book_files bf
    WHERE bf.book_id = ba.book_id
      AND bf.file_type = 'COVER_TRANSLATED'
      AND bf.file_name LIKE '%cover-translated-' || bt.target_language || '%'
  );
```

⚠️ This migration may link one cover translation addon to multiple translations if the book has many translations but fewer cover addons. Review carefully before running.

## Risks

- **Low code risk**: The change is 2-3 lines in the frontend. Backend already supports it.
- **Data inconsistency**: Existing addons without `translationId` won't show in translation-specific contexts. Users would need to regenerate the cover to fix. The optional migration script can fix historical data.
- **Cover file storage**: Cover files are stored as `cover-translated-{lang}.png` and matched by language in several places (PDF generation, admin publication detail, translation detail page). These would continue to work regardless of `translationId` linkage, since they use file name matching. No changes needed there.

## Files Involved

| File | What to change |
|------|---------------|
| `apps/web/src/components/book/author-journey.tsx` | Remove `!== ADDON_COVER_TRANSLATION` exclusion; add to `TRANSLATION_SCOPED_KINDS` |
| `apps/web/src/app/[locale]/dashboard/books/page.tsx` | No change needed (already filters by `translationId`) |
| `apps/api/src/addons/addon.service.ts` | No change needed (already handles `translationId` from params) |
| `apps/api/src/hooks/hooks.service.ts` | No change needed (already links cover translation in bundle flow) |

## Decision

Decided to **keep cover translation as a book-level addon** (March 2026) because:
1. **Users can generate translated covers without translating the book.** A user may want a Spanish cover for marketing, social media, or international listings without paying for a full book translation. Linking to `translationId` would force a translation to exist first, breaking this use case.
2. The current behavior works for the common case (cover matched by language in file name)
3. New bundle-created cover translations are already correctly linked (the bundle guarantees a translation exists)
4. The file-based inference workaround (below) solves the icon display issue without changing the data model

## Workaround: File-Based Inference for Collapsible Icons

### Problem
The translations collapsible in "My Books" shows addon icons per translation by filtering `bookAddon.translationId === translation.id`. Since most `ADDON_COVER_TRANSLATION` records have `translationId: null` (created via individual request or legacy data), the cover translation icon (Palette cyan) never appears — even when a translated cover file exists.

### Solution
Instead of relying solely on `translationId` linkage, the book listing API **infers** cover translation presence from the actual `BookFile` records. Cover translated files follow a predictable naming pattern: `cover-translated-{targetLanguage}.png`.

In `apps/api/src/books/book.service.ts`, when mapping translations for the list response:

```typescript
translations: book.translations.map((t) => {
  const kinds = new Set(book.addons.filter((a) => a.translationId === t.id).map((a) => a.kind));

  // Infer cover translation from file existence
  const hasCoverFile = book.files.some(
    (f) => f.fileType === 'COVER_TRANSLATED' && f.fileName?.includes(`cover-translated-${t.targetLanguage}`),
  );
  if (hasCoverFile) kinds.add('ADDON_COVER_TRANSLATION');

  return { ...t, addonKinds: [...kinds] };
}),
```

### Why this works
- Cover translated files always follow the pattern `cover-translated-{lang}.png` (enforced by `processAddonCoverTranslation` in the generation processor and `processAddonSpecific` in the hooks service)
- The file is the **source of truth** — if the file exists, the cover was translated, regardless of addon `translationId` linkage
- This is additive: if the addon already has `translationId` (bundle-created), it appears via the normal filter AND the file check (Set deduplicates)

### Trade-offs
- **Query cost**: Slightly larger `files` query (includes `COVER_TRANSLATED` alongside `COVER_IMAGE`). Minimal impact since it's a simple filter.
- **Accuracy**: If a cover file exists but the addon was cancelled/errored, the icon still shows. This is acceptable since the file represents a real, usable asset.
- **When the full fix is applied**: This workaround becomes redundant but harmless (Set deduplication). It can be cleaned up at that point or left as a safety net.

## Revisited: Retroactive Linking Between Cover Translation and Translation (March 2026)

### Question

After fixing the bundle sibling linking bug (where post-translation linking was stealing addons from other contexts), the question was raised: should we retroactively link a cover translation to a translation (or vice-versa) when one is created and the other already exists for the same language?

For example: user buys a standalone cover translation for Spanish, then later buys a full Spanish translation — should we automatically link the cover translation addon to the new BookTranslation?

### Analysis

**Conclusion: not worth implementing.** Reasons:

1. **Display already works without linkage** — The file-based inference (see workaround above) ensures the cover translation icon appears in the translations collapsible regardless of `translationId`. The file (`cover-translated-{lang}.png`) is the source of truth, not the addon record's `translationId`.

2. **Ambiguity in intent** — If a user bought a cover translation standalone (before any book translation existed), it was intentional. Automatically linking it to a later translation assumes an association the user may not intend. The cover may have been for marketing, social media, or international listings — not necessarily tied to a full book translation.

3. **Edge case risk with no real benefit** — The only scenario where missing linkage matters is having two translations in the same language (extremely unlikely). In that case, the cover would show in both via file matching — which is actually the correct behavior since there's only one cover per language anyway.

4. **Added complexity for no functional gain** — Detecting "the other exists in the same language" and deciding whether to link introduces fragile logic (checking both directions: cover created → find translation, translation created → find cover, handling races, etc.) with zero user-visible improvement.

5. **Bundle flow already handles it** — When both are purchased together in a bundle, the sibling linking (now scoped by `siblingAddonIds`) correctly associates them. The standalone path is the one that doesn't link, and that's by design.
