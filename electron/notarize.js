'use strict';

/**
 * macOS notarization — runs as electron-builder afterSign hook.
 *
 * Secrets contract (all 3 required):
 *   - APPLE_ID
 *   - APPLE_APP_SPECIFIC_PASSWORD
 *   - APPLE_TEAM_ID
 *
 * If any notarization value is missing, this hook exits safely and the build remains unsigned/unnotarized.
 */

exports.default = async function notarize(context) {
  if (process.platform !== 'darwin') return;

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('[notarize] Missing notarization secrets. Skipping notarization.');
    return;
  }

  // Lazily require so local development is unaffected when notarization tooling is not installed.
  let notarizeLib;
  try {
    notarizeLib = require('@electron/notarize');
  } catch {
    console.warn('[notarize] @electron/notarize is not installed. Skipping notarization.');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${context.appOutDir}/${appName}.app`;

  console.log(`[notarize] Notarizing ${appPath}...`);

  await notarizeLib.notarize({
    tool: 'notarytool',
    appBundleId: 'io.github.theaveragedeveloper.projectblackvault',
    appPath,
    appleId,
    appleIdPassword,
    teamId,
  });

  console.log('[notarize] Done.');
};
