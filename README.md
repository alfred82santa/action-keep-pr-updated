# Keep PR Updated

[![GitHub Super-Linter](https://github.com/alfred82santa/action-keep-pr-updated/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/alfred82santa/action-keep-pr-updated/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/alfred82santa/action-keep-pr-updated/actions/workflows/check-dist.yml/badge.svg)](https://github.com/alfred82santa/action-keep-pr-updated/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/alfred82santa/action-keep-pr-updated/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/alfred82santa/action-keep-pr-updated/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action that automatically keeps your pull requests up to date with the
base branch. This action helps maintain clean and conflict-free pull requests by
automatically updating them whenever this workflow runs (for example, after
changes are pushed to the base branch).

## Features

- 🔄 Automatically updates open pull requests with the latest changes from the
  base branch
- 🏷️ Filter pull requests by required labels
- 🚫 Skip pull requests with specific labels
- ⚡ Optional filtering for PRs with auto-merge enabled
- 📊 Detailed summary reports and outputs for workflow integration

## Quick Start

Add this action to your workflow to automatically keep all open pull requests
updated:

```yaml
name: Keep PRs Updated
on:
  push:
    branches:
      - main

# Required if not custom token used
#
# permissions:
#   contents: write
#   pull-requests: write

jobs:
  update-prs:
    runs-on: ubuntu-latest
    steps:
      - name: Keep PRs updated
        uses: alfred82santa/action-keep-pr-updated@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

> [!IMPORTANT]
>
> **Using a Personal Access Token (PAT)**
>
> To trigger PR checks after updating branches, you must use a
> [Personal Access Token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
> instead of the default `GITHUB_TOKEN`. This is because
> [events triggered by the default `GITHUB_TOKEN` do not create a new workflow runs](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs).
>
> To use a PAT with this action:
>
> 1. [Create a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
>    with appropriate permissions:
>    - **contents:** write
>    - **pull-requests:** write
> 1. Add it as a repository secret
> 1. Use it in the action:
>
>    ```yaml
>    - name: Keep PRs updated
>      uses: alfred82santa/action-keep-pr-updated@v1
>      with:
>        github-token: ${{ secrets.PAT }}
>    ```

## Inputs

| Input                | Description                                                    | Required | Default                   |
| -------------------- | -------------------------------------------------------------- | -------- | ------------------------- |
| `github-token`       | GitHub token to use for authentication                         | Yes      | `${{ github.token }}`     |
| `base-branch`        | The base branch to keep the pull requests updated with         | Yes      | Current branch or PR base |
| `required-labels`    | Comma-separated list of labels required to trigger the update  | No       | `''`                      |
| `required-automerge` | If true, only update PRs with auto-merge enabled               | No       | `false`                   |
| `avoided-labels`     | Comma-separated list of labels that prevent updates if present | No       | `''`                      |

## Outputs

| Output                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `pull-requests-updated` | Array of PR IDs that were successfully updated |
| `pull-requests-skipped` | Array of PR IDs that were skipped              |
| `pull-requests-failed`  | Array of PR IDs that failed to update          |

## Usage Examples

### Basic Usage

Update all open pull requests targeting the main branch:

```yaml
- name: Keep PRs updated
  uses: alfred82santa/action-keep-pr-updated@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Only Update PRs with Specific Labels

Update only pull requests that have the "keep-updated" label:

```yaml
- name: Keep PRs updated
  uses: alfred82santa/action-keep-pr-updated@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    base-branch: main
    required-labels: 'keep-updated'
```

### Skip PRs with Certain Labels

Update all PRs except those labeled with "do-not-update" or "wip":

```yaml
- name: Keep PRs updated
  uses: alfred82santa/action-keep-pr-updated@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    base-branch: main
    avoided-labels: 'do-not-update,wip'
```

### Only Update PRs with Auto-Merge Enabled

Update only pull requests that have auto-merge enabled:

```yaml
- name: Keep PRs updated
  uses: alfred82santa/action-keep-pr-updated@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    base-branch: main
    required-automerge: 'true'
```

### Using Outputs

Access the results of the action to perform additional workflow steps:

```yaml
- name: Keep PRs updated
  id: update-prs
  uses: alfred82santa/action-keep-pr-updated@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    base-branch: main

- name: Report results
  run: |
    echo "Updated PRs: ${{ steps.update-prs.outputs.pull-requests-updated }}"
    echo "Skipped PRs: ${{ steps.update-prs.outputs.pull-requests-skipped }}"
    echo "Failed PRs: ${{ steps.update-prs.outputs.pull-requests-failed }}"
```

## How It Works

1. The action fetches all open pull requests targeting the specified base branch
1. For each PR, it checks:
   - If `required-labels` is set, the PR must have at least one of those labels
   - If `avoided-labels` is set, the PR must not have any of those labels
   - If `required-automerge` is true, the PR must have auto-merge enabled
1. For qualifying PRs, it attempts to update the branch with the latest changes
   from the base branch
1. Results are reported in the workflow summary and available as outputs

## Scheduled Updates

To keep your PRs automatically updated, consider running this action on a
schedule:

```yaml
on:
  schedule:
    - cron: '0 0,6,12,18 * * *' # Every 6 hours
  workflow_dispatch: # Allow manual triggering
```

## Permissions

This action requires the following permissions:

```yaml
permissions:
  contents: write
  pull-requests: write
```

## Example

For example workflow runs, check out the
[our Keep PRs updated workflow](https://github.com/alfred82santa/action-keep-pr-updated/actions/workflows/keep-prs-updated.yml)!

---

## Development and Contributing

### Initial Setup

> [!NOTE]
>
> You'll need to have a reasonably modern version of
> [Node.js](https://nodejs.org) handy (24.x or later should work!). If you are
> using a version manager like [`nodenv`](https://github.com/nodenv/nodenv) or
> [`fnm`](https://github.com/Schniz/fnm), this repository has a `.node-version`
> file at the root that can be used to automatically switch to the correct
> version when you `cd` into the repository.

1. Install the dependencies

   ```bash
   npm install
   ```

1. Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

1. Run the tests

   ```bash
   npm test
   ```

### Testing Locally

The [`@github/local-action`](https://github.com/github/local-action) utility can
be used to test the action locally without having to commit and push changes.

Run it using:

- Visual Studio Code Debugger (see
  [`.vscode/launch.json`](./.vscode/launch.json))

- Terminal/Command Prompt

  ```bash
  npx @github/local-action . src/main.ts .env
  ```

You can provide a `.env` file to set environment variables and inputs. See
[`.env.example`](./.env.example) for an example configuration.

### Making Changes

1. Make your changes to the TypeScript source files in [`src/`](./src/)
1. Add or update tests in [`__tests__/`](./__tests__/)
1. Run formatting, linting, tests, and bundling:

   ```bash
   npm run all
   ```

   > This step is important! It will run [`rollup`](https://rollupjs.org/) to
   > build the final JavaScript action code with all dependencies included in
   > the `dist/` directory.

1. Commit your changes

### Releasing

This project uses [Semantic Versioning](https://semver.org/).

#### Automatic Releases

Releases are automatically generated on each push to specific branches:

- **`main` branch**: Creates a beta release (e.g., `1.2.3-beta.1`)
- **`release/*` branches**: Creates a release candidate (e.g., `1.2.3-rc.1`)

#### Manual release

To create a release, run the
[Make a Release workflow](https://github.com/alfred82santa/action-keep-pr-updated/actions/workflows/manual-make-release.yml)
on your chosen branch.

##### Automatic Release Level

When using the `automatic` release level, the type of release created depends on
the source branch:

- **`main` branch**: Creates a beta release (e.g., `1.2.3-beta.1`)
- **`release/*` branches**: Creates a release candidate (e.g., `1.2.3-rc.1`)
- **Other branches**: Creates an alpha release (e.g., `1.2.3-alpha.1`)

##### Production Release Level

When using the `production` release level:

- Creates a new stable release (e.g., `1.2.3`)
- If generated from a `release/*` branch, automatically creates a pull request
  to bump the version to the next patch version

> [!IMPORTANT]
>
> Stable releases must always be created from a `release/*` branch.

#### Release Branch Management

When a new `release/*` branch is created, the workflow automatically creates a
pull request against the `main` branch to bump the version to the next minor
version, ensuring the main branch stays ahead of the release branch.

## License

This project is licensed under the GNU Affero General Public License v3.0 - see
the [LICENSE](LICENSE) file for details.

## Author

Created by [alfred82santa](https://github.com/alfred82santa)
