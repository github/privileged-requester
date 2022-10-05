# Privileged Requester

This GitHub Action will automatically approve pull requests based off of requester criteria defined in the target repository.

## Workflow Configuration

The workflow should be configured like:

```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: ./
      with:
        myToken: ${{ secrets.GITHUB_TOKEN }}
        path: config/privileged-requester.yaml
        prCreator: ${{ github.event.pull_request.user.login }}
        prNumber: ${{ github.event.pull_request.number }}
```

See the example in [the workflow folder](.github/workflows/privileged-requester.yml)

## Requester Configuration

In the target repo, the privileged requester functionality should be configured like so:

```yaml
---
requesters:
  danhoerst:
    labels:
      - testing
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
