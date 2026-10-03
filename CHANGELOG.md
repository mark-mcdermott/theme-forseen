# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] - 2026-10-03

### Changed
- **A docked drawer keeps its layout at any width.** In a narrow window it used to switch to one column at a time and the phone's tighter spacing, though the page, not the window, sizes a docked drawer. It now shows both columns wherever it is docked, as it does in a bay on a wide page

### Fixed
- A page can move the element, as between a slot of its own and the body. Moving it counted another visit and loaded and drew the collection again; it is now one visit, and the drawer carries on as it was

## [0.9.0] - 2026-10-01

### Changed
- **Mixing faces from different pairings is done by keeping one.** A click anywhere on a font row now chooses its pairing. The selected row shows the heading and body faces in use as two buttons: press one to keep that face, and choosing another pairing changes only the other; press again to let it go. Before, each row carried two small tags that chose one face alone, which sat in the middle of a narrow row and caught clicks meant for the pairing
- The ⇄ swap is on the selected row, with the keep buttons, and a second press puts the pairing back as it comes
- Rows show the pairing's styles ("Serif + Sans") beneath its name
- The tests run on a port of their own (5373, or `TF_TEST_PORT`) and only reuse a server that is serving this repository's fixtures. They used port 3000 and would test whatever dev server happened to be there

### Fixed
- The keep buttons and the swap are full-size touch targets; the face tags and the old swap icon were under the 24 px minimum
- A column's search and filters no longer ride over its list. The list scrolls on its own beneath them, so a row passing the top is clipped rather than left with its heart and star half covered
- The tab on the page's edge was labelled "Open ThemeForseen" for assistive technology while showing "Themes"; its label now contains what it shows
- A face chosen alone in 0.8 or earlier, which stored no pairing, comes back as a kept face on the default pairing's row, where it can be let go

## [0.8.1] - 2026-09-30

### Fixed
- The heart and the star on a row were 26 px wide with nothing between them, which fell under the 24 px touch target once a page zoomed a docked drawer down. They are 29 px now, and the swatches in a narrow column give up the room

## [0.8.0] - 2026-09-30

### Added
- A `docked` attribute: the drawer fills the element instead of floating over the page, with no tab and no backdrop, so a page can give it a place of its own. Closed, it slides out of the element to the right. `--tf-dock-radius` rounds its corners. Docked, the arrow keys and the `s` and `h` shortcuts work while the pointer or the focus is on the drawer, and are the page's otherwise
- The element carries `mode="light"` or `mode="dark"`

### Changed
- **Preview on This Site is a compare key.** It used to close the drawer. Now it takes the selection off the page, which shows its own styles, and puts it back when pressed again or when anything is chosen. `state` and the change event carry `previewing`
- The two tabs are column headers: each sits over its own column at its width, with an icon of the pane it stands for and a chevron pointing where the column goes. Put away, a column leaves a stub on its side. The list and "Aa" icons are gone
- The Light / Dark switch is in the header beside the close button, without the sun beside it
- **Faces are registered through the font loading API, not linked into the page as stylesheets.** A stylesheet carrying `@font-face` rules makes Chrome rebuild every face the page has declared, and for a frame the page's own text is drawn in its fallbacks: each face the drawer asked for flashed the whole page. Faces added through the API leave the page's own alone. Where a host's CSS cannot be fetched, its stylesheet is linked as before
- The faces a moment calls for, such as a screenful of rows after a filter, are asked of Google Fonts in one request rather than one each
- The Apply modal is a `<dialog>` and the toast a popover, both in the browser's top layer, so nothing on the host page can sit above them, whatever the drawer is docked inside. The modal closes on Escape and on a click outside it

### Fixed
- The drawer's night palette was set inside the drawer, where it beat any `--tf-*` value a page had set on the element. It is keyed on the element's `mode` now, so a page's own rules hold in both modes
- A drawer that starts open opens on its selections, as one opened later already did
- Bringing a row into view scrolls its column and no longer the page
- In a narrow column the row of style pills wraps instead of pushing the column's controls past its edge

## [0.7.0] - 2026-09-30

### Changed
- The drawer's look, from the TF-01 design: the cloud and wordmark in the header, two tabs that put a column away or bring it back, a Light/Dark switch, a search in each column, All / Starred / Liked pills and a searchable tag menu for themes, style pills and a body-style menu for fonts, rows with a heart and a star, and a footer with Preview on This Site and Apply to Project. Day and night palettes of its own
- The tab on the side of the page is a plain dark key with the cloud; the purple gradient is gone
- Font rows lead with a sample of the heading face and name both faces, each one clickable on its own; beneath, the styles the pairing is made of
- The theme filter shows all, starred or liked themes, rather than any mix
- The font style pills filter by the heading face, one style at a time; the body menu still takes several
- Each list opens scrolled to its selection
- Starred and Liked are the words for the star and the heart, in place of Like and Love
- The drawer's own face is the system's; it no longer fetches Work Sans, which was a render-blocking request on every host page

### Added
- Custom properties on the element to skin the drawer: `--tf-font`, `--tf-width`, `--tf-radius`, the surfaces, inks and keys, and `--tf-cloud-1` to `-5` for the header cloud's stripes
- A search in the fonts column, kept between visits
- A search inside the tag menu
- Apply to Project writes the theme and the fonts together through the dev server, and without one shows both files to copy or save
- Face names in a font row can be chosen with the keyboard

### Removed
- The lightning button on each row, in favor of Apply to Project

## [0.6.2] - 2026-09-30

### Fixed
- A face the page declares itself with `@font-face` is no longer requested from Google Fonts as well
- Applying a pairing through the dev server wrote one variable, `--font-family`, holding the heading face alone. It now writes `--font-heading` and `--font-body`, with the same fallback stacks the live preview sets, so the applied CSS matches what the preview showed and what the Copy snippet documents
- `npx theme-forseen --version` and the server's health response reported 1.0.0 whatever the installed version

### Changed
- `color-namer` is bundled into the widget, so it is a development dependency rather than one installs pull in

## [0.6.1] - 2026-09-30

### Fixed
- Arrow keys, `s`, `h` and the star, heart and activate buttons ran once more for every filter change made since the page loaded, so an arrow press could skip rows and a star could toggle twice
- Selecting a theme no longer rebuilds the whole list, and rows out of view are no longer laid out or painted. A key press in the drawer takes about a fifth of the time it did
- With a filter active, the arrow keys scrolled the wrong row into view

### Changed
- Playwright updated to 1.63 for the tests

## [0.6.0] - 2026-09-29

### Added
- `themeforseen:change` event and a `state` getter reporting the mode, theme, fonts and whether the drawer is open
- `open()`, `close()` and `toggle()` methods, and an `open` attribute kept in step with the drawer
- `default-theme` and `default-fonts` attributes to name what a first visit gets
- `theme-forseen/data` entry exposing the collection without the element
- "Weather Station" theme and "Geist & Inter" font pairing (now 2,055 themes and 198 pairings)
- Type declarations for the element and its event

### Changed
- The collection is loaded separately from the element's code
- Font stylesheets are requested as pairings scroll into view in the open drawer, instead of all at page load
- A mode change from the page repaints while the drawer is closed
- `colorThemes` and `fontPairings` are exported from `theme-forseen/data` instead of `theme-forseen`

### Fixed
- A stored selection that is no longer in the collection falls back to the default instead of failing

## [0.5.0] - 2026-01-02

### Added
- 500+ additional color palettes (now 2,054 total)

## [0.4.0] - 2026-01-01

### Added
- 1,000+ additional color palettes (now 1,500+ total)
- Checkbox filters for color themes (filter by style/mood)
- CLI dev server for writing CSS variables to project files
- Additional font pairings

### Changed
- Improved font column UI/UX with better selection behavior
- Enhanced color theme column with smoother scrolling

### Fixed
- Font swap button not working correctly
- Favorites not persisting properly
- Drawer items not showing when scrolling up
- Various UI/UX bugs in both columns

## [0.3.0] - 2025-12-28

### Added
- Playwright test suite with 33 tests covering core functionality
- GitHub Actions CI with required status checks for PRs
- `darkmode-change` custom event listener for external dark mode integration

### Changed
- Simplified dark mode detection (removed polling, uses MutationObserver only)
- Consolidated light/dark state into objects for cleaner code
- Event listeners now use delegation pattern

### Removed
- Removed 200ms polling interval for dark mode sync
- Removed static `isApplyingTheme` flag (replaced with observer disconnect/reconnect)

## [0.2.0] - 2025-12-27

### Added
- CSS variable aliases (`--primary-color`, `--secondary-color`, `--heading-font`, `--body-font`)
- Individual font selection (mix heading from one pairing with body from another)
- Font swap button to switch heading and body fonts
- Keyboard shortcuts: `s` to star, `h` to heart current selection
- Column collapse/expand with persistence
- Mobile accordion behavior (one column open at a time)
- Filter themes by tags and search
- Filter fonts by heading/body style

### Changed
- Refactored into smaller modules (storage, template, styles, themeApplicator, etc.)
- Improved localStorage persistence with typed utilities

## [0.1.0] - 2024-12-15

### Added
- Initial release
- Live color theme preview with curated palettes
- Font pairing preview with Google Fonts integration
- Light and dark mode support with separate selections per mode
- Star (single) and heart (multiple) favorites system
- Arrow key and mouse wheel navigation
- Activation modal to export theme/font config
- Works as vanilla Web Component (framework agnostic)

[Unreleased]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mark-mcdermott/theme-forseen/releases/tag/v0.1.0
