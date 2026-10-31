# Prepare and activate a customized package

Use this procedure after selecting and building a release. Re-discover paths, service arguments, and environment overrides; preserve actual configuration rather than copying historical assumptions.

## Package and runtime preparation

Inspect `npm pack --json` output and confirm the archive contains the built standalone app, library exports, launcher scripts, config, and tool modules required by the package. Include the customized dependencies in the manifest and lockfile. Save a manifest identifying the source commit, upstream release, package checksum, runtime version, and dependency pins so the next upgrade can identify its baseline.

The 1.27.1 release required Node >=24 while the server's system Node was 22.23.3. The successful approach kept system Node untouched:

1. Download the chosen official Node distribution and its `SHASUMS256.txt` from `https://nodejs.org/dist/v<version>/` for the server architecture. Verify the archive checksum before extraction. Select a supported Node release from the target package's engines rather than reusing an old version unconditionally.
2. Extract into the versioned staging directory. Use its absolute `bin/node` to invoke its own `lib/node_modules/npm/bin/npm-cli.js` when preparing the isolated install. Prepend its bin directory to PATH for subprocesses, including npm/npx-based tools.
3. Install the staged custom tarball into a separate prefix with `--ignore-scripts --omit=dev` only after inspecting package lifecycle requirements. Verify version and run the packaged CLI's `--help` outside the source repo. Source-tree dependencies can hide missing packaged dependencies.
4. Copy the verified runtime to a root-owned versioned directory under `/opt/agent-canvas` during activation, retaining the old runtime for rollback. If that destination already exists, verify it before trusting it.

Stage a concrete root installer beside the tarball and checksum. Check it with `bash -n` and review the exact mutations. Use `set -euo pipefail`, explicit paths, and a unique backup directory. Validate root, inputs, checksums, disk space, and expected installed package before stopping anything. Recheck the package version and source manifest so a stale staging directory cannot silently become the next release.

## Service mutation and backups

`systemctl cat agent-canvas.service` shows the base unit and all overrides. The historical bind override was needed because newer Canvas versions bind ingress to loopback by default, while this installation is reached by a reverse proxy on another machine. Preserve `--public --host 0.0.0.0` and existing authentication settings unless current configuration says otherwise.

Perform activation in this order:

1. Create a restrictive backup directory and register an error handler that restarts the existing service if backup preparation fails.
2. Stop `agent-canvas.service`, then copy the exact installed customized package, `.openhands` state, environment configuration, base service unit, and drop-ins with metadata preserved. Back up the stopped state so databases and settings are consistent. Backups contain secrets: keep them private and retain ownership/modes when restoring.
3. Write a concrete rollback script and validate it. It must restore the old package/runtime selection/service configuration and any state affected by migration, reload systemd, and start the old service. Preserve post-upgrade state in a separate backup before replacing it. Also account for global launcher symlinks or binaries if installation changes them. Never use wildcard deletion or unvalidated restore paths.
4. Register automatic rollback for installation, configuration, and readiness failures. Allow one attempt; surface any rollback failure and stop rather than cycling deployments.
5. Install the custom archive globally at the existing prefix using the staged root-owned Node and npm. The 1.27.1 deployment used `--global --prefix /usr --omit=dev --ignore-scripts --no-audit --no-fund`; re-evaluate lifecycle scripts on later releases.
6. Add or update a narrowly scoped systemd runtime override. Use an absolute Node executable and launcher path and set PATH for child processes. For this deployment, the historical override was:

   ```ini
   [Service]
   Environment=PATH=/opt/agent-canvas/node-v24.21.0-linux-x64/bin:/home/cory/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
   ExecStart=
   ExecStart=/opt/agent-canvas/node-v24.21.0-linux-x64/bin/node /usr/lib/node_modules/@openhands/agent-canvas/bin/agent-canvas.mjs --public --host 0.0.0.0
   ```

   The empty `ExecStart=` clears earlier values. Check override ordering: another later drop-in must not undo the selected runtime or binding.
7. Reload systemd and start the service. Wait with bounded polling; allow several minutes for first-run `uvx` dependency downloads. Suppress expected transient curl connection failures while polling, but preserve a useful timeout diagnostic. Check frontend HTML, authenticated Agent Server responses, and Automation health/API readiness using the configured session key internally. Do not print response bodies containing secrets.
8. Disable automatic rollback only after readiness succeeds. Record actual versions, source commit, runtime path, backup path, and rollback command. Switch the clean remote source checkout to the deployed source branch if within the user's scope, preserving its previous branch for rollback.

## Interactive sudo

If sudo needs a password, prepare the complete installer and then provide a single command of this form:

```sh
ssh -t ai-server 'sudo bash /home/cory/.local/lib/agent-canvas-upgrade-<version>/install-agent-canvas-<version>.sh'
```

Use the SSH config fallback if needed on the executing machine. Explain that the password requirement comes from server sudo, not from this skill. Do not pause early for approval to prepare artifacts the upgrade request already authorizes. After the user runs the installer, verify remotely rather than relying only on its success message.

## Last successful rollback example

The 2026-10-13 upgrade retained the customized 1.25.0 package and state at:

`/home/cory/.local/share/agent-canvas-backups/20261013-214935`

Its restore command was `sudo bash /home/cory/.local/share/agent-canvas-backups/20261013-214935/rollback.sh`. This is historical recovery context. Inspect its contents and the current deployment before invoking it; future upgrades must print their own backup path.
