#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# =================================
# Configuration 
# =================================

# Change to required version
VALKEY_VERSION=8.1.0
VALKEY_DOWNLOAD_URL=https://github.com/valkey-io/valkey/archive/refs/tags/8.1.0.tar.gz
VALKEY_DOWNLOAD_SHA="559274e81049326251fa5b1e1c64d46d3d4d605a691481e0819133ca1f1db44f"

# =================================
# Build
# =================================

OUT_DIR=../$VALKEY_VERSION/fs
OUT_ROOTFS_TAR="$OUT_DIR"/alpine-rootfs.tar
OUT_ROOTFS_FLAT="$OUT_DIR"/alpine-rootfs-flat
OUT_FSJSON="$OUT_DIR"/alpine-fs.json
CONTAINER_NAME=alpine-v86-$VALKEY_VERSION
IMAGE_NAME=i386/alpine-v86-$VALKEY_VERSION

# Path to the versions.json file
VERSIONS_FILE="../versions.json"

mkdir -p "$OUT_DIR"
mkdir -p "../$VALKEY_VERSION/states"
docker build . --platform linux/386 --rm --tag "$IMAGE_NAME" \
    --build-arg VALKEY_VERSION="${VALKEY_VERSION}" \
    --build-arg VALKEY_DOWNLOAD_URL="${VALKEY_DOWNLOAD_URL}" \
    --build-arg VALKEY_DOWNLOAD_SHA="${VALKEY_DOWNLOAD_SHA}"

docker rm "$CONTAINER_NAME" || true
docker create --platform linux/386 -t -i --name "$CONTAINER_NAME" "$IMAGE_NAME"

docker export "$CONTAINER_NAME" -o "$OUT_ROOTFS_TAR"

# https://github.com/iximiuz/docker-to-linux/issues/19#issuecomment-1242809707
tar -f "$OUT_ROOTFS_TAR" --delete ".dockerenv" || true

./fs2json.py --out "$OUT_FSJSON" "$OUT_ROOTFS_TAR"

# Note: Not deleting old files here
mkdir -p "$OUT_ROOTFS_FLAT"
./copy-to-sha256.py "$OUT_ROOTFS_TAR" "$OUT_ROOTFS_FLAT"

echo "$OUT_ROOTFS_TAR", "$OUT_ROOTFS_FLAT" and "$OUT_FSJSON" created.