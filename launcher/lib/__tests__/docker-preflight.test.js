'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  combineCommandOutput,
  isCommandMissingText,
  isComposeSubcommandMissingText,
  isDockerDaemonNotRunningText,
  normalizeText,
} = require('../docker-preflight');

test('normalizeText lowercases values and handles null', () => {
  assert.equal(normalizeText('Docker ERROR'), 'docker error');
  assert.equal(normalizeText(null), '');
});

test('combineCommandOutput merges stdout, stderr, and error message', () => {
  const merged = combineCommandOutput({
    stdout: 'line-1',
    stderr: 'line-2',
    error: { message: 'line-3' },
  });
  assert.equal(merged, 'line-1\nline-2\nline-3');
});

test('isCommandMissingText detects common Unix and Windows messages', () => {
  assert.equal(isCommandMissingText('/bin/sh: docker: command not found'), true);
  assert.equal(
    isCommandMissingText("'docker' is not recognized as an internal or external command"),
    true
  );
});

test('isDockerDaemonNotRunningText detects daemon-down errors', () => {
  assert.equal(
    isDockerDaemonNotRunningText('Cannot connect to the Docker daemon at unix:///var/run/docker.sock'),
    true
  );
  assert.equal(
    isDockerDaemonNotRunningText('error during connect: this error may indicate that the docker daemon is not running'),
    true
  );
});

test('isComposeSubcommandMissingText detects missing compose plugin', () => {
  assert.equal(isComposeSubcommandMissingText("docker: 'compose' is not a docker command."), true);
  assert.equal(isComposeSubcommandMissingText('docker: unknown command: compose'), true);
  assert.equal(isComposeSubcommandMissingText('Docker Compose version v2.40.3'), false);
});
