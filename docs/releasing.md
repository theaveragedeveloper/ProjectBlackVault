# Releasing the Electron Desktop App

This project ships desktop installers through **GitHub Actions** using `electron-builder`.

- Workflow: `.github/workflows/electron-release.yml`
- Trigger: push a semantic version tag (`v*`, for example `v0.1.0`)
- Output: GitHub Release assets for Windows, macOS, and Linux (AppImage)

For the full secrets contract, see [`docs/release-secrets.md`](release-secrets.md).

## Prerequisites

1. You can push commits/tags to the repository.
2. You have Node.js and npm available locally.
3. `electron/package.json` has the version you want to release.
4. (Optional) Release secrets are configured if you want signed/notarized installers.

## Release steps (maintainer-friendly)

From a clean local checkout:

```bash
git checkout main
git pull
npm --prefix electron version patch --no-git-tag-version
git add electron/package.json electron/package-lock.json
git commit -m "chore(release): bump desktop version"

# optional: local packaging sanity check
npm run electron:dist

# push version commit
git push

# create and push release tag that matches electron/package.json version
npm run release:tag
```

What happens next:

1. Tag push (`vX.Y.Z`) triggers **Electron Tagged Release**.
2. CI builds installers on `windows-latest`, `macos-latest`, and `ubuntu-latest`.
3. `electron-builder` publishes assets to the matching GitHub Release.
4. Each matrix job uploads `electron/dist` as a workflow artifact for troubleshooting.

## Signing behavior

### Unsigned mode (default)

If signing secrets are not configured, the workflow still completes and publishes installers in unsigned mode. This is expected and explicitly logged in CI.

### Signed mode (optional)

If signing secrets are configured:

- macOS builds are signed.
- macOS notarization runs only when all notarization secrets are present.
- Windows installer signing runs when Windows certificate secrets are present.

## Safe testing before a real release

You can run the workflow manually with **workflow_dispatch**:

1. Open **Actions → Electron Tagged Release → Run workflow**
2. Leave `publish` unchecked (default)
3. (Optional) provide a semantic `tag` to validate tag handling

This mode builds installers and uploads workflow artifacts without publishing release assets.

## Troubleshooting

### "Tag format is invalid"
Use semantic version tags prefixed with `v`:

- ✅ `v0.1.0`
- ❌ `0.1.0`

### macOS build is not notarized
Check that all notarization secrets exist:

- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

### Release exists but a platform asset is missing
Open the failed matrix job and inspect:

- step logs (signing mode notice)
- uploaded `electron/dist` artifact

### Need to retry a failed release

1. Fix the issue in a new commit.
2. Re-run the failed job, or cut a new tag (for example `v0.1.1`).
3. Confirm assets on the release page after rerun.

## Where users should download

- Latest release page: `https://github.com/theaveragedeveloper/ProjectBlackVault/releases/latest`
