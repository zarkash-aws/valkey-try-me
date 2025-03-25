# Try-Valkey Images

This repository provides tools, instructions, and necessary binary files for creating and running custom images for the [Try-Valkey](https://zarkash-aws.github.io/try-valkey.github.io) project. The emulator operates on a 32-bit Alpine Linux base, ensuring a lightweight and efficient environment. The images include the Valkey server and CLI, prepared for booting with all necessary configurations.

This repository integrates two functionalities:
1. **Image Creation Tools:** Tools and scripts for building and customizing Valkey images.
2. **Binary Image Storage:** Pre-built binary files for different Valkey versions, structured for easy use.

This project is based on the [v86 project](https://github.com/copy/v86). Users seeking additional customization options or expanded emulator support should refer to the v86 repository.

---

## Repository Structure

### Image Creation Tools
- **src:** Contains files required to build a filesystem that includes Valkey, fully configured and ready to run.
- **utils:** Provides debugging tools and utilities to modify the image, save states, and make additional customizations.

- **vos:** Houses files needed to execute the image in a browser environment, organized into:
  - **v86:** JavaScript and binary files necessary for running the v86 emulator.
  - **xterm:** Resources for UI/UX integration with terminal emulation.
- **example:** A working example demonstrating how to use the binary files. 
### Binary Image Storage
Each version of Try-Valkey has its own directory, named according to its version tag, containing:
- **fs:** Stores the generated binary filesystem files, including configurations and boot information.
- **state:** Contains compressed binary files representing a booted state of the system.

---

## Creating and Customizing an Image

### Prerequisites

**Ensure Docker is Installed**
Verify that Docker is installed and running by executing:

```bash
docker --version
```

If Docker is not installed, refer to the installation guides for your operating system:
- [Docker Desktop installation guide](https://docs.docker.com/desktop/) (macOS and Windows)
- [Docker Engine installation guide](https://docs.docker.com/engine/install/) (Linux and other OS)

### Steps
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
   - Open `utils/image_creator.html` in your browser:
        - in terminal:
           ```bash
           cd ..
           python3 -m http.server 8888
            ```
        - in web browser, navigate to http://localhost:8888/utils/image_creator.html
   - Wait for the boot process to complete. You'll know it's finished when data appears in the server log.
   - Make modifications to the image (e.g., loading keys, editing state via CLI or VM terminal).
   - Click **"Save State"** to download a binary file of the current state.

4. **Compress the Binary File**
   
   ```bash
    gzip <state_file_name>
   ```
   This ensures compatibility with the Try-Valkey page.
   After compressing, move the compressed state file to the `<version-tag>/state` directory. 



