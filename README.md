# Privileged Requester

[![CodeQL](https://github.com/github/privileged-requester/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/github/privileged-requester/actions/workflows/codeql-analysis.yml) [![package-check](https://github.com/github/privileged-requester/actions/workflows/package-check.yml/badge.svg)](https://github.com/github/privileged-requester/actions/workflows/package-check.yml) [![units-test](https://github.com/github/privileged-requester/actions/workflows/test.yml/badge.svg)](https://github.com/github/privileged-requester/actions/workflows/test.yml)

This GitHub Action will automatically approve pull requests based off of requester criteria defined in the target repository.

## Use Case

Let's say you have a repository with a lot of dependabot PRs that are safe to automatically merge because you have a super duper robust test suite. You can use this Action to automatically approve pull requests from the dependabot user (or any other user you want).

Here are some bonus use cases:

- Automatically approve pull requests that were created by some automation that your team wrote
- Automatically approve pull requests that were created by a bot user that you have created
- Automatically approve pull requests that were created by a bot user that you have created and that have a specific label
- Automatically approve pull requests that were created by an admin/priviliged user for your project

## Workflow Configuration

Here is an example of how to use this Action in its simplest form:

> Where `vX.X.X` is the latest release version found on the releases page

```yaml
name: privileged-requester
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]

permissions:
  pull-requests: write
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: github/privileged-requester@vX.X.X
        with:
          path: config/privileged-requester.yaml # the path on the repo's default branch where the privileged requester config can be found
          checkCommits: "true" # check to ensure all commits are made by the requester
          checkDiff: "true" # check to ensure the diff is only removals (no additions) - set to "false" to disable
          checkLabels: "true" # check to ensure the labels on the PR match those defined in the privileged requester config
```

> Note: The `config/privileged-requester.yaml` file should be added to the default branch of the target repository before this workflow is run. Otherwise, the workflow will fail since it cannot find the configuration file.

See the example in [the workflow folder](.github/workflows/privileged-requester.yml)

## Requester Configuration

In the target repo, the privileged requester functionality should be configured like so:

```yaml
---
requesters:
  dependabot[bot]:
    labels:
      - dependencies
      - github_actions
```

See the example in the [config folder](config/privileged-requester.yaml).

The location of this file in the target repo should be the path used in the workflow configuration `path`

## Reviewer

This Action runs, by default, with the built-in `GITHUB_TOKEN` and so approves the PRs as the `github-actions[bot]` user.

However, you can configure the Action to run with a different repo scoped token - a bot user of your own - by defining the Workflow configuration option `github_token` pointing to the repo secret for that token.

## Configuration

Here are the configuration options for this Action:

### Inputs 📥

| Input     | Required? | Default                                     | Description |
|-----------| --------- |---------------------------------------------| ----------- |
| `github_token`   | yes | `${{ github.token }}`                         | The GitHub token used to create an authenticated client - Provided for you by default! - You can use the default provided token or you can provide a PAT as an alternative robot user token. Make sure this is a repository scoped token |
| `handle` | yes | `'github-actions[bot]'` | When using the default `${{ github.token }}` (as seen above), the "handle" is fetched from this input since the token is repository scoped and it cannot even read its own handle. You should not need to change this input. |
| `path`      | yes | `config/privileged-requester.yaml`            | Path where the privileged requester configuration can be found |
| `prCreator` | yes | `${{ github.event.pull_request.user.login }}` | The creator of the PR for this pull request event |
| `prNumber`  | yes | `${{ github.event.pull_request.number }}`     | The number of the PR for this pull request event |
| `checkCommits` | yes | `"true"`                                       | An option to check that every commit in the PR is made from the privileged requester |
| `checkDiff` | yes | `"true"`                                       | An option to check that the PR diff only has a removal diff, with no additions - This option defaults to `"true"` but it can be disabled by setting it to `"false"` |
| `checkLabels` | yes | `"true"`                                       | An option to check that the labels on the PR match those defined in the privileged requester config |
| `commitVerification` | yes | `"false"` | Whether or not to validate all commits have proper verification via GPG signed commits |

### Outputs 📤

| Output | Description |
| ------ | ----------- |
| `approved` | The string `"true"` if the privileged-requester approved the pull request |
| `commits_verified` | The string `"true"` if all commits in the PR are signed/verified |

## First Time Setup

It should be noted that this Action looks at the `default` branch for its configuration file. This means that if you add this Action through a pull request, it will look at the default branch and _fail_ because it cannot find the config file that has not landed on `main` / `master` yet. After merging the pull request that adds this Action to your repository, it should work as expected.

## GitHub App Permissions

If you are using a GitHub app with this Action, you will need to grant the following permissions:

- Checks: `Read and write`
- Contents: `Read and write`
- Metadata: `Read-only`
- Pull requests: `Read and write`

### Subscribe to Events

This GitHub App will subscribe to the following events:

- Check suite
- Check run
- Pull request

## Known Issues

### Duplicate Approvals

There is logic built into this Action to try and prevent duplicate approvals from taking place. However, if you subscribe to many `pull_request` events in your Actions workflow you may see duplicate approvals. Here is an example of the workflow configuration that could cause this and why:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]
```

Now if you were to open a pull request and apply labels to it during the creation process, you would likely see two approvals from this workflow (assuming you pass the privileged requester criteria). This is because the `pull_request` event is triggered twice - once for the `opened` event and once for the `labeled` event. If you want to avoid this, you can remove the `labeled` event from the workflow configuration or the `opened` event.
