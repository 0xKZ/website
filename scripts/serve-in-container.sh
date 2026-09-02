#!/usr/bin/env bash
#
# serve-in-container.sh — build and serve this website inside an Apple
# container, so npm / Node.js never run on the host Mac.
#
# What it does:
#   1. Starts a container from the pi-container agent image
#      (pi-coding-agent:local — it already ships Node.js + npm) on the
#      "default" network. Internet access is needed so npm can fetch
#      packages *into the container*; nothing npm-related ever runs on the Mac.
#   2. Runs `npm ci` inside the container. Every package is verified against
#      the integrity hashes in package-lock.json. The npm cache is persisted
#      at ~/.pi-container-npm/<project>/ on the host and bind-mounted into the
#      container, so only the first run downloads anything.
#      (npm ci also wipes node_modules and reinstalls, which matters because
#      the native binaries in a Mac-installed node_modules — e.g. sharp —
#      don't work on Linux.)
#   3. Starts Eleventy's dev server (live reload) on port 8080 inside the
#      container and publishes it to localhost:$PORT on the Mac. The inner
#      port is 8080 (Eleventy's own default), but that port only exists
#      inside the container.
#
# The default host port is 4173 — deliberately not 8080, which is a popular
# port for other local servers (e.g. a llama-server hosting local models).
#
# Usage:
#   ./scripts/serve-in-container.sh                  # build + serve on http://localhost:4173
#   ./scripts/serve-in-container.sh --port 9000      # publish on localhost:9000 instead
#   ./scripts/serve-in-container.sh --build-only     # npm ci + build into _site/, then exit
#
# Environment overrides:
#   IMAGE_TAG        (default: pi-coding-agent:local)
#   MEMORY           (default: 2g)
#   PORT             (default: 4173)
#   PI_CONTAINER_DIR (default: <repo-parent>/pi-container — only used for hints)
#
# Stop with Ctrl+C — the container is torn down automatically (--rm).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

IMAGE_TAG="${IMAGE_TAG:-pi-coding-agent:local}"
MEMORY="${MEMORY:-2g}"
PORT="${PORT:-4173}"
PI_CONTAINER_DIR="${PI_CONTAINER_DIR:-$(cd "$PROJECT_DIR/.." && pwd)/pi-container}"

# Eleventy's dev server binds all interfaces inside the container; we publish
# a fixed inner port and map the host port to it.
INNER_PORT=8080

BUILD_ONLY=false

usage() {
  # Print the header comments (skipping the title line) up to and including
  # the "Stop with Ctrl+C" sentinel, so this keeps working as the header grows.
  grep '^# ' "$0" | sed 's/^# \{0,1\}//' | sed -n '2,$p' \
    | awk '/^Stop with Ctrl\+C/{print; exit} {print}'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --port)
      if [ $# -lt 2 ]; then echo "--port requires a value." >&2; exit 1; fi
      PORT="$2"; shift 2 ;;
    --build-only) BUILD_ONLY=true; shift ;;
    --image)
      if [ $# -lt 2 ]; then echo "--image requires a value." >&2; exit 1; fi
      IMAGE_TAG="$2"; shift 2 ;;
    --memory)
      if [ $# -lt 2 ]; then echo "--memory requires a value." >&2; exit 1; fi
      MEMORY="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1 (see --help)" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Preconditions
# ---------------------------------------------------------------------------

if ! command -v container >/dev/null 2>&1; then
  echo "ERROR: the 'container' CLI (Apple container) is not installed or not on PATH." >&2
  echo "       Install it from https://github.com/apple/container and try again." >&2
  exit 1
fi

if ! container system status >/dev/null 2>&1; then
  echo "Container service is not running. Starting..." >&2
  container system start
fi

if ! container image inspect "$IMAGE_TAG" >/dev/null 2>&1; then
  echo "ERROR: container image '$IMAGE_TAG' not found." >&2
  echo "       Build it first with:" >&2
  echo "         cd $PI_CONTAINER_DIR && ./scripts/build.sh" >&2
  exit 1
fi

# If the host port is taken, the container runtime dies deep in bootstrap
# with an inscrutable `bind(): Address already in use (errno: 48)`.
# Check up front and fail with something actionable instead.
check_port_free() {
  local port="$1" holders="" probe
  if command -v lsof >/dev/null 2>&1; then
    holders="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  fi
  if [ -z "$holders" ]; then
    # Fallback if lsof is missing: probe the loopback addresses.
    for probe in 127.0.0.1 ::1; do
      if (exec 3<>"/dev/tcp/$probe/$port") 2>/dev/null; then
        holders="(something is listening on $probe:$port)"
        break
      fi
    done
  fi
  if [ -n "$holders" ]; then
    {
      echo "ERROR: port $port is already in use on your Mac:"
      printf '%s\n' "$holders" | sed 's/^/       /'
      echo ""
      echo "Pick a free port instead:"
      echo "  ./$(basename "$0") --port <other-port>    (or: PORT=<other-port> ./$(basename "$0"))"
    } >&2
    exit 1
  fi
}

if [ "$BUILD_ONLY" != true ]; then
  check_port_free "$PORT"
fi

# Container-dedicated npm cache, kept outside the project tree so the host
# never sees container npm state (mirrors the Gradle cache pattern in
# pi-container/scripts/run.sh).
NPM_CACHE_DIR="${HOME}/.pi-container-npm/${PROJECT_NAME}"
mkdir -p "$NPM_CACHE_DIR"

# Unique name so parallel runs don't collide; readable in `container list`.
SESSION_ID="$(head -c 4 /dev/urandom | od -An -tx1 | tr -d ' \n')"
CONTAINER_NAME="${PROJECT_NAME}-serve-${SESSION_ID}"

# ---------------------------------------------------------------------------
# In-container commands
#
# PROJECT_NAME / INNER_PORT are passed via --env and expanded by the
# container's bash (this script's bash must not expand them here).
# ---------------------------------------------------------------------------

INNER_CMD='
set -e
cd "/projects/${PROJECT_NAME}"
echo "==> [container] npm ci (installing dependencies inside the container)"
npm ci --no-audit --no-fund
'
if [ "$BUILD_ONLY" = true ]; then
  INNER_CMD+='
echo "==> [container] building site"
npx @11ty/eleventy
echo "==> [container] build complete — output written to _site/ (visible on your Mac)"
'
else
  INNER_CMD+="
echo \"==> [container] starting Eleventy dev server on port ${INNER_PORT}\"
exec npx @11ty/eleventy --serve --port \"\${INNER_PORT}\"
"
fi

# ---------------------------------------------------------------------------
# Launch
# ---------------------------------------------------------------------------

PUBLISH_ARGS=()
if [ "$BUILD_ONLY" != true ]; then
  PUBLISH_ARGS=(--publish "${PORT}:${INNER_PORT}")
fi

echo ""
echo "Project:   $PROJECT_DIR"
echo "Image:     $IMAGE_TAG"
echo "Container: $CONTAINER_NAME"
echo "npm cache: $NPM_CACHE_DIR  (persists across runs)"
if [ "$BUILD_ONLY" != true ]; then
  echo "Site:      http://localhost:${PORT}   (Ctrl+C to stop)"
else
  echo "Mode:      build-only (no server)"
fi
echo ""

container run --rm -it \
  --name "$CONTAINER_NAME" \
  --network default \
  ${PUBLISH_ARGS[@]+"${PUBLISH_ARGS[@]}"} \
  --memory "$MEMORY" \
  --volume "$PROJECT_DIR:/projects/$PROJECT_NAME" \
  --volume "$NPM_CACHE_DIR:/home/pi/.npm" \
  --entrypoint bash \
  --env "PROJECT_NAME=$PROJECT_NAME" \
  --env "INNER_PORT=$INNER_PORT" \
  "$IMAGE_TAG" \
  -c "$INNER_CMD"
