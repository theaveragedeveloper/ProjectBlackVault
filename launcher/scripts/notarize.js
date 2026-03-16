"use strict";

const { notarize } = require("@electron/notarize");

async function runNotarization(context) {
  const { electronPlatformName, appOutDir, packager } = context;

  if (electronPlatformName !== "darwin") {
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    throw new Error(
      "macOS notarization requires APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID."
    );
  }

  const appName = packager.appInfo.productFilename;
  await notarize({
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword,
    teamId,
  });
}

module.exports = runNotarization;
