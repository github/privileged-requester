# Privileged Requester

[![CodeQL](https://github.com/github/privileged-requester/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/github/privileged-requester/actions/workflows/codeql-analysis.yml) [![package-check](https://github.com/github/privileged-requester/actions/workflows/package-check.yml/badge.svg)](https://github.com/github/privileged-requester/actions/workflows/package-check.yml) [![units-test](https://github.com/github/privileged-requester/actions/workflows/test.yml/badge.svg)](https://github.com/github/privileged-requester/actions/workflows/test.yml) [![privileged-requester](https://github.com/github/privileged-requester/actions/workflows/privileged-requester.yml/badge.svg)](https://github.com/github/privileged-requester/actions/workflows/privileged-requester.yml)

This GitHub Action will automatically approve pull requests based off of requester criteria defined in the target repository.

## Workflow Configuration

The workflow should be configured like:

> Where `vX.X.X` is the latest release version found on the releases page

```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
    # checkout the repository
    - uses: actions/checkout@v4

    # run privileged-requester
    - uses: github/privileged-requester@vX.X.X
```

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

However, you can configure the Action to run with a different repo scoped token - a bot user of your own - by defining the Workflow configuration option `robotUserToken` pointing to the repo secret for that token.

## Configuration

Here are the configuration options for this Action:

## Inputs 📥

| Input     | Required? | Default                                     | Description |
|-----------| --------- |---------------------------------------------| ----------- |
| `myToken`   | yes | `${{ github.token }}`                         | The GitHub token used to create an authenticated client - Provided for you by default! |
| robotUserToken | no | -                                           | An alternative robot user PAT to be used instead of the built-in Actions token |
| `path`      | yes | `config/privileged-requester.yaml`            | Path where the privileged requester configuration can be found |
| `prCreator` | yes | `${{ github.event.pull_request.user.login }}` | The creator of the PR for this pull request event |
| `prNumber`  | yes | `${{ github.event.pull_request.number }}`     | The number of the PR for this pull request event |
| `checkCommits` | yes | `"true"`                                       | An option to check that every commit in the PR is made from the privileged requester |
| `checkDiff` | yes | `"true"`                                       | An option to check that the PR diff only has a removal diff, with no additions |
| `checkLabels` | yes | `"true"`                                       | An option to check that the labels on the PR match those defined in the privileged requester config |

## Outputs 📤

| Output | Description |
| ------ | ----------- |
| `approved` | The string `"true"` if the privileged-requester approved the pull request |
