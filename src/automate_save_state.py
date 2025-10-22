#!/usr/bin/env python3
import asyncio
import subprocess
import time
import os
import sys
import gzip
import shutil
from pathlib import Path
from playwright.async_api import async_playwright

# Configuration
PORT = 8888
VALKEY_VERSION = os.getenv('VALKEY_VERSION', '8.1.0')
TIMEOUT_SECONDS = 300  # 5 minutes max wait for boot
CHECK_INTERVAL = 2  # Check every 2 seconds

async def wait_for_boot_complete(page, timeout=TIMEOUT_SECONDS):
    """Wait for boot to complete by checking for server log data"""
    print("⏳ Waiting for boot process to complete...")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            # Check if server log has content (indicates boot complete)
            log_content = await page.locator('#log-terminal-container').inner_text()
            if log_content and len(log_content.strip()) > 0:
                print("✅ Boot process completed!")
                return True
            
            # Alternative: Check for specific boot completion text
            # Adjust the selector/text based on actual page behavior
            await asyncio.sleep(CHECK_INTERVAL)
            
        except Exception as e:
            await asyncio.sleep(CHECK_INTERVAL)
    
    print("❌ Timeout waiting for boot to complete")
    return False

async def automate_state_save(valkey_version):
    """Main automation function"""
    
    # Start HTTP server
    print(f"🚀 Starting HTTP server on port {PORT}...")
    server_process = subprocess.Popen(
        ['python3', '-m', 'http.server', str(PORT)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Give server time to start
    await asyncio.sleep(2)
    
    try:
        async with async_playwright() as p:
            # Launch browser
            print("🌐 Launching browser...")
            browser = await p.chromium.launch(headless=True)  # Set to True for headless
            
            # Setup download handling
            context = await browser.new_context(accept_downloads=True)
            page = await context.new_page()
            
            # Navigate to image creator
            url = f'http://localhost:{PORT}/{VALKEY_VERSION}/image_creator.html'
            print(f"📡 Navigating to {url}")
            await page.goto(url)
            
            # Wait for boot to complete
            boot_success = await wait_for_boot_complete(page, TIMEOUT_SECONDS)
            
            if not boot_success:
                raise Exception("Boot process did not complete in time")
            
            # Optional: Add custom modifications here
            # await perform_custom_modifications(page)
            
            # Click "Download State" button
            print("💾 Downloading state...")
            async with page.expect_download() as download_info:
                await page.click('button:has-text("Download State")')
                download = await download_info.value
            
            # Save the download
            download_filename = download.suggested_filename
            temp_path = f'/tmp/{download_filename}'
            await download.save_as(temp_path)
            print(f"✅ State downloaded: {temp_path}")
            
            # Compress the file
            print("🗜️  Compressing state file...")
            compressed_path = f'{temp_path}.gz'
            with open(temp_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            print(f"✅ State compressed: {compressed_path}")
            
            # Move to correct directory
            target_dir = Path(f'{valkey_version}/states')
            target_dir.mkdir(parents=True, exist_ok=True)
            target_path = target_dir / f'{download_filename}.gz'
            shutil.move(compressed_path, target_path)
            print(f"✅ State moved to: {target_path}")
            
            # Cleanup
            os.remove(temp_path)
            
            # Close browser
            await browser.close()
            print("🎉 Automation completed successfully!")
            
    finally:
        # Stop HTTP server
        print("🛑 Stopping HTTP server...")
        server_process.terminate()
        server_process.wait()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        VALKEY_VERSION = sys.argv[1]
    
    print(f"🔧 Automating state save for Valkey version: {VALKEY_VERSION}")
    asyncio.run(automate_state_save(VALKEY_VERSION))