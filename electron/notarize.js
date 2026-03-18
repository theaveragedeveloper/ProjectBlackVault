'use strict';

/**
 * macOS notarization — runs as electron-builder afterSign hook.
 *
 * Prerequisites (optional — removes Gatekeeper warnings):
 *   1. Apple Developer account ($99/yr)
 *   2. Set these CI secrets:
 *      APPLE_ID                  — your Apple ID email
 *      APPLE_APP_SPECIFIC_PASSWORD — app-specific password from appleid.apple.com
 *      APPLE_TEAM_ID             — 10-char team ID from developer.apple.com
 *
 * If these env vars are absent the hook is a no-op, so unsigned builds work fine.
 * Install the notarization tool: npm install --save-dev @electron/notarize
 */

exports.default = async function notarize(context) {
  if (process.platform !== 'darwin') return;
  if (!process.env.APPLE_ID) return; // skip if not configured

  // Lazily require so the package is optional in dev
  let notarizeLib;
  try {
    notarizeLib = require('@electron/notarize');
  } catch {
    console.warn('[notarize] @electron/notarize not installed — skipping notarization.');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${context.appOutDir}/${appName}.app`;

  console.log(`[notarize] Notarizing ${appPath}...`);

  await notarizeLib.notarize({
    tool: 'notarytool',
    appBundleId: 'io.github.theaveragedeveloper.projectblackvault',
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });

  console.log('[notarize] Done.');
};
