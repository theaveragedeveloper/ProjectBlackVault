# Release Secrets Contract

This document defines the GitHub Actions secrets used by the Electron release pipeline.

Workflow: `.github/workflows/electron-release.yml`

## Security rules

- Never commit certificates, private keys, or plaintext secrets to this repository.
- Store secrets only in GitHub **Repository secrets** or **Organization secrets**.
- Do not place signing material in tracked `.env` files.

## Secret matrix

| Secret | Purpose | Required? | Notes |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | Publish release assets to GitHub Releases | Required (provided by Actions) | Built-in token; no manual secret needed in normal setup. |
| `APPLE_CERTIFICATE_P12` | macOS code-signing certificate for Electron builds | Optional | Base64-encoded `.p12` certificate content. |
| `APPLE_CERTIFICATE_PASSWORD` | Password for `APPLE_CERTIFICATE_P12` | Optional | Required if `APPLE_CERTIFICATE_P12` is set. |
| `APPLE_SIGNING_IDENTITY` | Explicit macOS signing identity (certificate common name) | Optional | If omitted, electron-builder uses certificate discovery from provided cert. |
| `APPLE_ID` | Apple ID for notarization | Optional | Must be set with `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID` to enable notarization. |
| `APPLE_APP_SPECIFIC_PASSWORD` | Apple app-specific password for notarization | Optional | Generate from your Apple ID account settings. |
| `APPLE_TEAM_ID` | Apple Developer Team ID | Optional | 10-character team identifier. |
| `WINDOWS_CERTIFICATE_P12` | Windows code-signing certificate for installer signing | Optional | Base64-encoded `.p12` certificate content. |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password for `WINDOWS_CERTIFICATE_P12` | Optional | Required if `WINDOWS_CERTIFICATE_P12` is set. |

## Unsigned vs signed behavior

### No signing/notarization secrets configured (default)

- Release pipeline still builds installers.
- Artifacts are still uploaded/published.
- Builds are **unsigned** and (for macOS) **not notarized**.
- Workflow logs explicitly show unsigned mode notices.

### Signing/notarization secrets configured

- macOS builds are signed when Apple certificate secrets are present.
- macOS notarization runs only when all notarization secrets are present.
- Windows builds are signed when Windows certificate secrets are present.

## Secret format details

### Certificate secrets (`*_CERTIFICATE_P12`)

Use base64-encoded `.p12` content.

Example local command to produce base64 text:

```bash
base64 -i signing-cert.p12 | pbcopy
```

Paste the copied output into the GitHub secret value.

### Configure secrets in GitHub

1. Open repository **Settings**.
2. Go to **Secrets and variables → Actions**.
3. Choose **New repository secret**.
4. Add each secret using the exact names listed above.

## Operational recommendation

Start with unsigned releases to validate the pipeline, then add signing secrets incrementally (macOS first, then Windows) and verify each platform in Actions logs.
