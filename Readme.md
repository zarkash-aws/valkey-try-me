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

## Creating Filesystem and State from Scratch

### Prerequisites

**Ensure Docker is Installed**
Verify that Docker is installed and running by executing:

```bash
docker --version
```

If Docker is not installed, refer to the installation guides for your operating system:
- [Docker Desktop installation guide](https://docs.docker.com/desktop/) (macOS and Windows)
- [Docker Engine installation guide](https://docs.docker.com/engine/install/) (Linux and other OS)

###  Steps
1. **Update the Build Script**
   - Modify `src/build.sh` to match the desired Valkey version:
   
   ```bash
    VALKEY_VERSION=7.2.8
    VALKEY_DOWNLOAD_URL=https://github.com/valkey-io/valkey/archive/refs/tags/7.2.8.tar.gz
    VALKEY_DOWNLOAD_SHA="2d990b374b783ba05e0081498718ed0640f84bc60b6db24a4bc069f9775f778c"
   ```
   - For `VALKEY_DOWNLOAD_URL` and `VALKEY_DOWNLOAD_SHA`, refer to the [Valkey hashes file](https://github.com/valkey-io/valkey-hashes).

2. **Run the Build Script**
   - This step creates a filesystem that loads the server at boot and the CLI in `ttys0`.
   
   ```bash
   cd src
   ./build.sh
   ```
   - The generated filesystem will be saved in the `<version-tag>/fs` directory.

3. **Open the Image Creator Tool**
   In `utils/image_creator.html`, set: 
   ```js
   baseurl: "../<version-tag>/fs/alpine-rootfs-flat", 
   basefs: "../<version-tag>/fs/alpine-fs.json"
   ```
   Replace <version-tag> with your actual version directory.

   Then, run a local server:
   
      ```bash
      cd ..
      python3 -m http.server 8888
      ```
   In web browser, navigate to http://localhost:8888/utils/image_creator.html.
   Wait for the boot process to complete. You'll know it's finished when data appears in the server log.
   Modify the image as needed (e.g., loading keys, editing state via CLI or VM terminal).
   Click **"Save State"** to download a binary file of the current state.

4. **Compress the Binary File**
   
   ```bash
    gzip <state_file_name>
   ```
   This ensures compatibility with the Try-Valkey page.
   After compressing, move the compressed state file to the `<version-tag>/state` directory. 
   ```bash
    mv <state_file_name>.gz <version-tag>/state/
   ```

---

## Creating a New State from an Existing Filesystem
If a filesystem for your desired version already exists in versions.json, follow these steps:
1. Set `baseurl` and `basefs` in `utils/image_creator.html` using values from `versions.json`:
   ```js
   baseurl: "<baseurl path from versions.json>"
   basefs: "<basefs path from versions.json>"
   ```
2. Then, run a local server:
   
      ```bash
      cd ..
      python3 -m http.server 8888
      ```
   In web browser, navigate to http://localhost:8888/utils/image_creator.html.
   Wait for the boot process to complete. You'll know it's finished when data appears in the server log.
   Modify the image as needed (e.g., loading keys, editing state via CLI or VM terminal).
   Click **"Save State"** to download a binary file of the current state.

3. Compress the state binary file that you downloaded in the previous step
   ```bash
    gzip <path-to-state-file>
   ```
   This ensures compatibility with the Try-Valkey page.
   After compressing, move the compressed state file to the `<version-tag>/state` directory. 

--- 

## Test Your State
Use the examples in /example to verify that your saved state works correctly:
- Update the filesystem and state paths to point to your created versions.
- Launch and confirm expected behavior in the emulator.