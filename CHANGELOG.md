# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Playwright test suite with 33 tests covering core functionality
- `darkmode-change` custom event listener for external dark mode integration

### Changed
- Simplified dark mode detection (removed polling, uses MutationObserver only)
- Consolidated light/dark state into objects for cleaner code
- Event listeners now use delegation pattern

### Removed
- Removed 200ms polling interval for dark mode sync
- Removed static `isApplyingTheme` flag (replaced with observer disconnect/reconnect)

## [0.2.0] - 2024-12-28

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

[Unreleased]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/mark-mcdermott/theme-forseen/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mark-mcdermott/theme-forseen/releases/tag/v0.1.0
