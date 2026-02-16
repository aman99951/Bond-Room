#!/usr/bin/env bash
set -euo pipefail

REQUIRED_FILE="${1:-.ci/required-build-env.txt}"

if [[ ! -f "${REQUIRED_FILE}" ]]; then
  echo "Required env definition file not found: ${REQUIRED_FILE}"
  exit 1
fi

MISSING=()

while IFS= read -r NAME || [[ -n "${NAME}" ]]; do
  [[ -z "${NAME}" ]] && continue
  [[ "${NAME}" =~ ^# ]] && continue
  if [[ -z "${!NAME:-}" ]]; then
    MISSING+=("${NAME}")
  fi
done < "${REQUIRED_FILE}"

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "Missing required build env vars:"
  for var_name in "${MISSING[@]}"; do
    echo " - ${var_name}"
  done
  exit 1
fi

echo "Required build env vars are present."
