# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
