# Gridsong visual thesis

## Direction: night-market neon notation

Gridsong should feel like a small music stall that has just clicked on after dusk: dark indigo canvas, painted-sign lettering, glowing fruit-colour note tiles, and warm paper labels. The grid is the hero and the decorative layer stays quiet enough for children to understand the next action in two seconds. This is deliberately not Chrome Music Lab’s primary-colour geometry and not a generic glass/gradient dashboard.

## Palette

- `ink` `#090D22`: the night sky and page background.
- `stall` `#121936`: raised working surfaces.
- `stall-high` `#1A2348`: hover and grouped control surfaces.
- `paper` `#FFF7DE`: primary text, borrowed from hand-painted menu cards.
- `paper-muted` `#BBC2DC`: secondary text (7.7:1 on `ink`).
- `mango` `#FFC857`: primary action and playhead (11.2:1 with `ink`).
- `guava` `#FF5D8F`: melodic note family / focused energy.
- `mint` `#4EE1B6`: success, save, and second note family.
- `sky` `#73B7FF`: links and third note family.
- `plum` `#B996FF`: fourth note family.
- `danger` `#FF8A7A`: recoverable errors and destructive actions.

The experience is intentionally single-mode. A dark, explicitly painted canvas is essential to the night-market metaphor and gives note states strong, classroom-projector-friendly contrast. Shape, labels, and state text accompany colour everywhere.

## Type and rhythm

- Display: local/system `Trebuchet MS`, with its friendly painted-sign curves. It is used only for the wordmark and major headings.
- Utility/body: local/system `Avenir Next`, `Segoe UI`, sans-serif for legible classroom controls and tabular numbers. No network font requests.
- Scale: 0.875rem utility, 1rem body, 1.25rem label, 1.75rem section, clamp(2.25rem–4.5rem) display.
- Spacing follows an 8px base with 4px optical adjustments. Controls are at least 44px and adjacent interactive targets have at least 8px between them.

## Interaction grammar

- Notes are lantern tiles: unlit notes are recessed navy squares; active notes lift, brighten, and show a small inset spark so state never depends on colour alone.
- The playhead is a narrow mango awning moving left to right. Playback controls live directly above the composition, like a shop counter.
- Primary actions are solid mango with dark text. Secondary actions are ink-blue signs with paper outlines. Status appears as a compact paper ticket with a textual message.
- On phones, creation controls stack, transport stays near the grid, and export/gallery actions move below composition. The grid scrolls horizontally rather than shrinking below a usable touch target.

## Motion policy

UI transitions run 160–220ms and use opacity/transform only. A newly toggled note lifts once; the playhead moves discretely on the beat; dialogs fade from their trigger. There are no decorative loops or flashes. Under `prefers-reduced-motion`, transitions are removed, note lifts become instant colour changes, and the playhead changes position without animation.

## Asset plan and provenance

The hero asset is an original, generated editorial still-life: a tabletop step-sequencer made of glowing market lantern tiles beneath striped awnings. It sets the world and previews the interaction without pretending to be an app screenshot. Supporting icons are hand-authored inline SVG with rounded, sign-painter geometry.

### Prompt sheet

- Use case: stylized-concept
- Asset type: compact landing-page hero / classroom music atmosphere
- Subject: an abstract tabletop music grid built from luminous square lantern buttons, a few buttons lit in a rising melody, tiny percussion tokens, no people
- World: friendly night market music stall after dusk, striped canvas awning and subtle hanging bulbs, educational and playful rather than nightclub-like
- Medium: tactile cut-paper and painted wood miniature, editorial product illustration
- Composition: wide 3:2 crop, grid in the lower two-thirds, uncluttered dark area around it, no interface text
- Light: warm mango lantern glow with guava, mint, sky-blue, and plum accents on deep indigo
- Materials: matte painted wood, folded paper, frosted lantern glass, subtle grain
- Negative list: no words, letters, numbers, logos, watermark, Google styling, Chrome colours, keyboards, screens, photorealistic people, hands, brand marks, excessive bloom

Generated with the factory Azure image model (`factory-image`) on 2026-08-27. The final file and its exact prompt sidecar live in `assets/src/`. Generated imagery is original to this product and used under the repository’s MIT license. The PWA icons are raster exports of the repository’s hand-authored `public/icon.svg`; no third-party icon asset was used.
