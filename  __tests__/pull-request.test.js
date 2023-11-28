import { GitHubProvider } from "../src/github-provider";
import { PullRequest } from "../src/pull-request";
import * as core from "@actions/core";
const nock = require("nock");

// jest spy on to silence output
jest.spyOn(core, "info").mockImplementation(() => {});
jest.spyOn(core, "error").mockImplementation(() => {});
jest.spyOn(core, "warning").mockImplementation(() => {});
jest.spyOn(core, "debug").mockImplementation(() => {});
jest.spyOn(core, "setFailed").mockImplementation(() => {});
jest.spyOn(core, "setOutput").mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
  nock("https://api.github.com")
    .persist()
    .get("/user")
    .reply(200, { login: "octocat" });
});

test("We can create a review", async () => {
  let provider = new GitHubProvider("token");
  jest.spyOn(provider, "hasAlreadyApproved").mockImplementation(() => false);
  jest.spyOn(provider, "createReview").mockImplementation(() => true);
  expect(provider.createReview()).toBe(true);

  let pullRequest = new PullRequest(provider);
  let approval = await pullRequest.approve();
  expect(core.info).toHaveBeenCalledWith(
    "Approving the PR for a privileged reviewer.",
  );
  expect(approval).toStrictEqual(undefined);
});

test("We attempt to create a review but we already approved in a previous workflow run", async () => {
  let provider = new GitHubProvider("token");
  jest.spyOn(provider, "hasAlreadyApproved").mockImplementation(() => true);

  let pullRequest = new PullRequest(provider);
  let approval = await pullRequest.approve();
  expect(core.info).toHaveBeenCalledWith(
    "PR has already been approved by this Action, skipping duplicate approval.",
  );
  expect(approval).toStrictEqual(undefined);
});

test("We can list commits", async () => {
  let prCommits = [
    { author: { login: "robot" } },
    { author: { login: "danhoerst" } },
  ];
  let provider = new GitHubProvider("token");
  jest.spyOn(provider, "listPRCommits").mockImplementation(() => prCommits);
  expect(provider.listPRCommits()).toBe(prCommits);

  let pullRequest = new PullRequest(provider);
  let commits = await pullRequest.listCommits();
  expect(commits).toStrictEqual(prCommits);
});

test("We can list labels", async () => {
  let prLabels = [{ name: "bug" }, { name: "feature-request" }];
  let provider = new GitHubProvider("token");
  jest.spyOn(provider, "listLabelsOnPR").mockImplementation(() => prLabels);
  expect(provider.listLabelsOnPR()).toBe(prLabels);

  let pullRequest = new PullRequest(provider);
  let labels = await pullRequest.listLabels();
  expect(labels).toStrictEqual(prLabels);
});

test("We can get the diff", async () => {
  let prDiff = `| diff --git a/.github/workflows/check-dist.yml b/.github/workflows/check-dist.yml
index 2f4e8d9..93c2072 100644
--- a/.github/workflows/check-dist.yml
+++ b/.github/workflows/check-dist.yml
@@ -44,7 +44,7 @@ jobs:
         id: diff
 
       # If index.js was different than expected, upload the expected version as an artifact
-      - uses: actions/upload-artifact@v2
+      - uses: actions/upload-artifact@v3
         if: blah
         with:
           name: dist`;
  let provider = new GitHubProvider("token");
  jest.spyOn(provider, "getPRDiff").mockImplementation(() => prDiff);
  expect(provider.getPRDiff()).toBe(prDiff);

  let pullRequest = new PullRequest(provider);
  let diff = await pullRequest.getDiff();
  expect(diff).toStrictEqual(prDiff);
});
