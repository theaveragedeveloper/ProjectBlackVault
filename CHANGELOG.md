# Changelog

## 2026-03-19 - V1 Public Release Prep

### Fixed

- Fixed duplicate navigation chrome by disabling app shell navigation on the `/login` route.
- Fixed broken build navigation link from accessory detail pages to the correct firearm build route.
- Improved image picker reliability:
  - Syncs preview state when the current image URL changes
  - Handles non-JSON upload errors safely
  - Adds URL validation and clearer error handling
- Added authenticated uploaded-image serving route at `/uploads/[...path]` so newly uploaded files render in production.

### Docker / Release

- Switched main compose file to build from local source for release consistency.
- Aligned upload persistence path to `/app/uploads` and set `IMAGE_UPLOAD_DIR` in Docker runtime.
- Updated development compose path mappings to match runtime behavior.
- Fixed Docker healthcheck to use `127.0.0.1` so containers become healthy reliably.
- Simplified and corrected Docker-only README and `.env.example` guidance.
