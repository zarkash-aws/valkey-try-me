# Try-Valkey Images

This repository provides tools and instructions for creating and running custom images for the Try Valkey project. The emulator operates on a 32-bit Alpine Linux base, ensuring a lightweight and efficient environment. The images include the Valkey server and CLI, prepared for booting with all necessary configurations.
This project is based on the [v86 project](https://github.com/copy/v86). Users seeking additional customization options or expanded emulator support should refer to the v86 repository.
This repository contains tools and scripts for building and customizing Valkey images.

---

## Repository Structure

### Image Creation Tools
- **src:** Contains files required to build a filesystem that includes Valkey, fully configured and ready to run.
- **utils:** Provides debugging tools and utilities to modify the image, save states, and make additional customizations.
- **example:** A working example demonstrating how to use the saved states. 
### Binary Image Storage
- Prebuilt filesystems and state binaries are hosted on a CDN. The relevant URLs are listed in versions.json.

---


## 1. Creating a Filesystem and State

You can either build the filesystem from scratch (`MODE="local"`) or use a prebuilt one (`MODE="remote"`).


### Option 1: Use a Prebuilt Filesystem (`MODE="remote"`)

If a filesystem for your desired version already exists in versions.json, run: 

   ```bash
   MODE=remote VALKEY_VERSION=<version-tag> ./src/build.sh
   ```
A directory named `<version-tag>/` will be created.
`image_creator.html` will be generated and automatically configured to use remote CDN URLs from versions.json.


### Option 2: Build Filesystem from Scratch (`MODE="local"`)

#### Prerequisites

**Ensure Docker is Installed**
Verify that Docker is installed and running by executing:

```bash
docker --version
```

If Docker is not installed, refer to the installation guides for your operating system:
- [Docker Desktop installation guide](https://docs.docker.com/desktop/) (macOS and Windows)
- [Docker Engine installation guide](https://docs.docker.com/engine/install/) (Linux and other OS)

####  Build
   Run:
   ```bash
   MODE=local VALKEY_VERSION=<version-tag> \
   VALKEY_DOWNLOAD_URL=<download_url> \
   VALKEY_DOWNLOAD_SHA=<download_sha> \
   ./src/build.sh
   ```
   - For `VALKEY_VERSION`, `VALKEY_DOWNLOAD_URL` and `VALKEY_DOWNLOAD_SHA`, refer to the [Valkey hashes file](https://github.com/valkey-io/valkey-hashes).

   for example:
   ```bash
   MODE=local VALKEY_VERSION=8.1.0 \
   VALKEY_DOWNLOAD_URL=https://github.com/valkey-io/valkey/archive/refs/tags/8.1.0.tar.gz \
   VALKEY_DOWNLOAD_SHA=559274e81049326251fa5b1e1c64d46d3d4d605a691481e0819133ca1f1db44f \
   ./src/build.sh
   ```
   A directory named `<version-tag>/` will be created with the generated filesystem and state directories.
   `image_creator.html` will be generated and preconfigured to use the local paths for the generated filesystem.

## **2. Launch the Emulator and Save State**

1. Run a local server:
   
      ```bash
      cd ..
      python3 -m http.server 8888
      ```
2. In web browser, navigate to http://localhost:8888/utils/image_creator.html.
   Wait for the boot process to complete. You'll know it's finished when data appears in the server log.
3. (optional) Modify the image as needed (e.g., loading keys, editing state via CLI or VM terminal).
4. Click **"Download State"** to download a binary file of the current state.
5. Compress the binary state file that was downloaded in the previous step.  
   
   ```bash
    gzip <binary_state_file>
   ```
   This ensures compatibility with the Try-Valkey page.
6. After compressing, move the compressed state file to the `<version-tag>/state` directory. 
   ```bash
    mv <binary_state_file>.gz <version-tag>/state/
   ```

## (Optional) Test Your State
Use the examples in /example to verify that your saved state works correctly:
- Update the filesystem and state paths to point to your created versions.
- Launch and confirm expected behavior in the emulator.