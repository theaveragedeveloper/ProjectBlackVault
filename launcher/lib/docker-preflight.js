'use strict';

const COMMAND_MISSING_PATTERNS = [
  'command not found',
  'not recognized as an internal or external command',
  'is not recognized as the name of a cmdlet',
  'executable file not found in $path',
  'executable file not found in %path%',
  'no such file or directory',
  'spawn docker enoent',
  'spawn docker-compose enoent',
];

const DOCKER_NOT_RUNNING_PATTERNS = [
  'cannot connect to the docker daemon',
  'is the docker daemon running',
  'error during connect',
  'docker desktop is shutting down',
  'open //./pipe/docker_engine',
];

const COMPOSE_MISSING_PATTERNS = [
  "docker: 'compose' is not a docker command",
  'docker: unknown command: compose',
  'unknown docker command "compose"',
  "docker: 'compose' is not a docker command.",
];

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function combineCommandOutput(result) {
  if (!result) return '';
  const errorMessage = result.error && result.error.message ? result.error.message : result.error;
  return [result.stdout || '', result.stderr || '', errorMessage || ''].join('\n');
}

function hasAnyPattern(text, patterns) {
  const normalized = normalizeText(text);
  return patterns.some(pattern => normalized.includes(pattern));
}

function isCommandMissingText(text) {
  return hasAnyPattern(text, COMMAND_MISSING_PATTERNS);
}

function isDockerDaemonNotRunningText(text) {
  return hasAnyPattern(text, DOCKER_NOT_RUNNING_PATTERNS);
}

function isComposeSubcommandMissingText(text) {
  return hasAnyPattern(text, COMPOSE_MISSING_PATTERNS);
}

module.exports = {
  combineCommandOutput,
  isCommandMissingText,
  isComposeSubcommandMissingText,
  isDockerDaemonNotRunningText,
  normalizeText,
};
