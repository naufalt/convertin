import { app, ipcMain, shell } from 'electron';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl?: string;
  fileName?: string;
  publishedAt?: string;
}

const GITHUB_REPO = 'naufalt/convertin';

function fetchLatestRelease(): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      headers: {
        'User-Agent': 'Convertin-App',
        Accept: 'application/vnd.github.v3+json'
      }
    };

    https
      .get(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              resolve(JSON.parse(rawData));
            } else if (res.statusCode === 404) {
              resolve(null);
            } else {
              reject(new Error(`GitHub API returned status ${res.statusCode}: ${rawData}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

function compareVersions(v1: string, v2: string): number {
  // returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
  const clean = (v: string) => v.replace(/^v/i, '').trim();
  const p1 = clean(v1).split('.').map(Number);
  const p2 = clean(v2).split('.').map(Number);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

let downloadedInstallerPath: string | null = null;

export function setupUpdateManager(mainWindow: Electron.BrowserWindow | null) {
  // Check for updates
  ipcMain.handle('updater:check', async (): Promise<UpdateInfo> => {
    const currentVersion = app.getVersion();
    try {
      const release = await fetchLatestRelease();
      if (!release) {
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseName: '',
          releaseNotes: ''
        };
      }

      const latestTag = release.tag_name || release.name || '';
      const hasUpdate = compareVersions(latestTag, currentVersion) > 0;

      // Find Windows installer asset (.exe)
      let downloadUrl: string | undefined;
      let fileName: string | undefined;

      if (Array.isArray(release.assets)) {
        const exeAsset = release.assets.find((a: any) => a.name?.toLowerCase().endsWith('.exe'));
        if (exeAsset) {
          downloadUrl = exeAsset.browser_download_url;
          fileName = exeAsset.name;
        }
      }

      return {
        hasUpdate,
        currentVersion,
        latestVersion: latestTag.replace(/^v/i, ''),
        releaseName: release.name || latestTag,
        releaseNotes: release.body || 'No release notes provided.',
        downloadUrl,
        fileName,
        publishedAt: release.published_at
      };
    } catch (err: any) {
      console.error('[Updater] Failed to check for update:', err);
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseName: '',
        releaseNotes: '',
        fileName: err.message
      };
    }
  });

  // Download update
  ipcMain.handle('updater:download', async (_event, downloadUrl: string): Promise<{ success: boolean; error?: string }> => {
    if (!downloadUrl) {
      return { success: false, error: 'No download URL specified' };
    }

    try {
      const tempDir = app.getPath('temp');
      const targetPath = path.join(tempDir, 'Convertin-Update-Setup.exe');

      await new Promise<void>((resolve, reject) => {
        const requestWithRedirect = (url: string) => {
          https.get(url, { headers: { 'User-Agent': 'Convertin-App' } }, (res) => {
            // Handle redirects (GitHub uses 302 redirects for release asset downloads)
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              requestWithRedirect(res.headers.location);
              return;
            }

            if (res.statusCode !== 200) {
              reject(new Error(`Failed to download update, status code: ${res.statusCode}`));
              return;
            }

            const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
            let receivedBytes = 0;
            const fileStream = fs.createWriteStream(targetPath);

            res.on('data', (chunk) => {
              receivedBytes += chunk.length;
              if (totalBytes > 0 && mainWindow && !mainWindow.isDestroyed()) {
                const percent = Math.round((receivedBytes / totalBytes) * 100);
                mainWindow.webContents.send('updater:download-progress', {
                  percent,
                  receivedBytes,
                  totalBytes
                });
              }
            });

            res.pipe(fileStream);

            fileStream.on('finish', () => {
              fileStream.close();
              downloadedInstallerPath = targetPath;
              resolve();
            });

            fileStream.on('error', (err) => {
              fs.unlink(targetPath, () => {});
              reject(err);
            });
          }).on('error', (err) => reject(err));
        };

        requestWithRedirect(downloadUrl);
      });

      return { success: true };
    } catch (err: any) {
      console.error('[Updater] Download error:', err);
      return { success: false, error: err.message };
    }
  });

  // Install downloaded update and restart
  ipcMain.handle('updater:install', async () => {
    if (!downloadedInstallerPath || !fs.existsSync(downloadedInstallerPath)) {
      return { success: false, error: 'Installer file not found' };
    }

    try {
      // In Inno Setup, /SP- disables the "This will install... Do you wish to continue?" prompt
      // /SUPPRESSMSGBOXES prevents dialogs from popping up
      // /SILENT runs the wizard without asking pages
      // Launch installer detached so it proceeds after app exits
      const child = spawn(
        downloadedInstallerPath,
        ['/SILENT', '/SP-', '/SUPPRESSMSGBOXES', '/CLOSEAPPLICATIONS', '/RESTARTAPPLICATIONS'],
        {
          detached: true,
          stdio: 'ignore'
        }
      );
      child.unref();

      // Exit current application immediately so the installer can overwrite locked files
      setTimeout(() => {
        app.exit(0);
      }, 300);

      return { success: true };
    } catch (err: any) {
      console.error('[Updater] Install error:', err);
      return { success: false, error: err.message };
    }
  });

  // Open release page in browser
  ipcMain.handle('updater:open-release-page', async () => {
    await shell.openExternal(`https://github.com/${GITHUB_REPO}/releases`);
  });
}

