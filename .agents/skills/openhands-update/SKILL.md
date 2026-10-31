---
name: openhands-update
description: Upgrade Cory's customized OpenHands Agent Canvas deployment on ssh ai-server, preserving fork changes, validating a locally built package, and preparing backups and rollback. Use for updating this deployment or troubleshooting its upgrade and LLM credential errors.
---

# Update the OpenHands deployment

Maintain Cory's custom Canvas fork through upstream upgrades. An upgrade request authorizes preparing and deploying that upgrade; creating or invoking this skill alone does not authorize unrelated changes. Follow current execution permissions. Prepare everything possible before returning an interactive sudo command to the user.

## Deployment identity

These are discovery hints, last verified on 2026-10-13. Recheck them each time:

| Item | Location |
| --- | --- |
| SSH alias | `ai-server` (user `cory`; hostname `ubuntu-ai`) |
| Local source | `/home/cory/Code/web-apps/OpenHands` |
| Custom fork | `corynorris/OpenHands` |
| Upstream | `https://github.com/OpenHands/OpenHands.git` |
| Remote source | `/home/cory/openhands-canvas` |
| Running package | `/usr/lib/node_modules/@openhands/agent-canvas` |
| System service | `agent-canvas.service` |
| Configuration | `/home/cory/.agent-canvas.env` |
| Durable state | `/home/cory/.openhands` |
| Ingress | Port 8000, `--public --host 0.0.0.0` behind the existing reverse proxy |
| Staging | `/home/cory/.local/lib/agent-canvas-upgrade-<version>` |
| Deployment backups | `/home/cory/.local/share/agent-canvas-backups/<timestamp>` |

The local `openhands-canvas` duplicate was archived and removed. The **remote** directory with that name is the custom fork's source. Directory names do not identify the running code: the system service launches a globally installed package.

The last successful package was custom Canvas **1.27.1**, source commit `30d91a23aa1cc3b7274c2d506e2cebe979213a04`, branch `upgrade/agent-canvas-1.27.1`, with Agent Server 1.54.0, Automation 1.19.3, and a separate Node 24.21.0 runtime at `/opt/agent-canvas/node-v24.21.0-linux-x64`. These versions are historical evidence, not future upgrade targets. The remote source checkout was still on the older `mine` branch after installation; the newer branch was imported there. Determine the deployed source baseline before merging another release.

## Workflow

1. **Discover the live installation.** Inspect service status and drop-ins, installed package version, active process executable, remote Git remotes/branches/status, and local Git status. Read repository `AGENTS.md` and relevant contributor skills before resolving code changes. Never print `.agent-canvas.env`, decrypted settings, process environments, or unfiltered logs containing credentials.
2. **Choose a published release.** Query `npm view @openhands/agent-canvas version` and inspect that release's upstream tag, `package.json` engines, and `config/defaults.json`. Do not independently bump the pinned SDK or Automation versions. Distinguish the latest stable npm release from upstream main.
3. **Preserve the custom fork.** Create an upgrade branch from the source that produced the currently deployed custom build. Fetch the release tag and merge it. Keep Cory's file browsing/search, Godot/GDScript support, model preview, Changes review, and light/dark theme controls unless the user asks to remove them. A stock `npm install -g @openhands/agent-canvas@latest` would replace these customizations.
4. **Resolve and validate.** Preserve upstream dependency changes plus custom dependencies; regenerate `package-lock.json` through npm and install with `npm ci`. Merge translations by key, preserving intentional custom deletions and detecting overlapping edits. Run i18n generation, completeness checks, lint/typecheck/formatting, tests, standalone build, and library build as appropriate to the repository. Do not run npm tasks that regenerate locales concurrently: `make-i18n` removes and recreates `public/locales`. If broad tests reveal failures, fix them and rerun affected tests; report full-suite results and targeted reruns accurately.
5. **Package and stage.** Commit the merge, then package the built custom release with `npm pack`. `--ignore-scripts` is appropriate only after explicitly completing the required build/prepack work. Save package SHA-256, source commit, version pins, and verification results alongside the package. Transfer a Git bundle when the remote needs the source branch and verify bundle prerequisites. Install into an isolated staging prefix and smoke-test the CLI using the required Node version before changing the live package.
6. **Deploy with rollback.** Read [references/deployment.md](references/deployment.md) to prepare a concrete installer, backups, runtime changes, readiness checks, and rollback. Do not run a previous version's installer blindly. If `sudo -n true` fails, finish staging and provide the exact `ssh -t ai-server 'sudo bash ...'` command; do not request the user's password or try to bypass sudo.
7. **Verify the result.** Independently check the installed version, active runtime, service status/restart count, authenticated Agent Server and Automation responses, and frontend through the deployed ingress. Review logs with secret redaction. An HTTP 401 proves a backend answered but does not prove authenticated readiness. Align the clean remote source checkout with the deployed branch when authorized and record it; preserve local changes. Give the actual backup location and rollback command. If verification still fails after one automatic rollback, stop deployment retries and diagnose.

## Credential errors

For `litellm ... DeepseekException - Illegal header value b'Bearer ...'`, read [references/credentials.md](references/credentials.md). Inspect token formatting without displaying values, correct only a confirmed malformed credential, and distinguish saved settings from existing conversations that retain older configuration. A successful unrelated response does not prove the affected credential is valid.

## SSH and tooling constraints

- The system SSH configuration has previously failed with `Bad owner or permissions on /usr/etc/ssh/ssh_config.d/50-suse.conf`. The working fallback was `ssh -F /home/cory/.ssh/config ai-server ...`; use the same config for `scp`. The alias uses a jump host, so an error may mention the jump host rather than the final server. Do not modify system SSH permissions to work around this.
- A sandbox `socket: Operation not permitted` is an execution restriction. Request the available network escalation before making the user collect information manually. Do not infer that their alias or server is broken.
- Use a writable npm cache such as `--cache /tmp/openhands-npm-cache` when the default cache is outside writable roots.
- Keep deployment and validation separate: ordinary skill maintenance never requires stopping the live service.
