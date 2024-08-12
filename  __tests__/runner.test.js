import { GitHubProvider } from "../src/github-provider";
// import { PrivilegedRequester } from "../src/privileged-requester";
import { PullRequest } from "../src/pull-request";
import { Runner } from "../src/runner";
import * as core from "@actions/core";

const nock = require("nock");

nock("https://api.github.com")
  .persist()
  .get("/user")
  .reply(200, { login: "octocat" });

let provider = new GitHubProvider("token");
let pullRequest = new PullRequest(provider);
let runner = new Runner(pullRequest);

// jest spy on to silence output
jest.spyOn(core, "info").mockImplementation(() => {});
jest.spyOn(core, "error").mockImplementation(() => {});
jest.spyOn(core, "warning").mockImplementation(() => {});
jest.spyOn(core, "debug").mockImplementation(() => {});
jest.spyOn(core, "setFailed").mockImplementation(() => {});
jest.spyOn(core, "setOutput").mockImplementation(() => {});

afterEach(() => {
  process.env["INPUT_CHECKCOMMITS"] = "";
  process.env["INPUT_CHECKLABELS"] = "";
  process.env["INPUT_CHECKDIFF"] = "";
});

describe("processCommits", () => {
  test("We process commits successfully", async () => {
    process.env["INPUT_COMMITVERIFICATION"] = "false";
    let prCommits = [
      { author: { login: "robot" }, verification: { verified: false } },
    ];
    jest.spyOn(pullRequest, "listCommits").mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processCommits("robot");
    expect(commits).toStrictEqual(true);
  });

  test("We process commits successfully with missing commit verification objects", async () => {
    process.env["INPUT_COMMITVERIFICATION"] = "false";
    let prCommits = [{ author: { login: "robot" } }];
    jest.spyOn(pullRequest, "listCommits").mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processCommits("robot");
    expect(commits).toStrictEqual(true);
  });
});

describe("processCommits without verification", () => {
  test("We process commits unsuccessfully due to verification missing", async () => {
    jest.clearAllMocks();
    process.env["INPUT_COMMITVERIFICATION"] = "true";
    let prCommits = [
      { author: { login: "robot" }, verification: { verified: false } },
    ];
    jest.spyOn(pullRequest, "listCommits").mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processCommits("robot");
    expect(commits).toStrictEqual(false);
  });

  test("We process commits unsuccessfully with missing commit verification objects", async () => {
    process.env["INPUT_COMMITVERIFICATION"] = "true";
    let prCommits = [{ author: { login: "robot" } }];
    jest.spyOn(pullRequest, "listCommits").mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processCommits("robot");
    expect(commits).toStrictEqual(false);
  });
});

describe("processDiff", () => {
  test("We process the diff successfully", async () => {
    let prDiff = `| diff --git a/.github/workflows/check-dist.yml b/.github/workflows/check-dist.yml
index 2f4e8d9..93c2072 100644
--- a/.github/workflows/check-dist.yml
+++ b/.github/workflows/check-dist.yml
@@ -44,7 +44,7 @@ jobs:
         id: diff
 
       # If index.js was different than expected, upload the expected version as an artifact
-      - uses: actions/upload-artifact@v2
         if: blah
         with:
           name: dist`;
    jest.spyOn(pullRequest, "getDiff").mockImplementation(() => prDiff);
    expect(pullRequest.getDiff()).toBe(prDiff);

    let diff = await runner.processDiff();
    expect(diff).toStrictEqual(true);
  });

  test("We process the diff unsuccessfully", async () => {
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
    jest.spyOn(pullRequest, "getDiff").mockImplementation(() => prDiff);
    expect(pullRequest.getDiff()).toBe(prDiff);

    let diff = await runner.processDiff();
    expect(diff).toStrictEqual(false);
  });
});

describe("labelsEqual", () => {
  test("We process labels successfully", async () => {
    let prLabels = ["bug", "feature-request"];
    let configuredLabels = ["bug", "feature-request"];

    let labels = await runner.labelsEqual(prLabels, configuredLabels);
    expect(labels).toStrictEqual(true);
  });

  test("We process labels unsuccessfully", async () => {
    let prLabels = ["bug", "feature-request"];
    let configuredLabels = ["new", "feature-request"];

    let labels = await runner.labelsEqual(prLabels, configuredLabels);
    expect(labels).toStrictEqual(false);
  });
});

describe("processLabels", () => {
  test("We process labels successfully", async () => {
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    jest.spyOn(pullRequest, "listLabels").mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let commits = await runner.processLabels({
      labels: ["bug", "feature-request"],
    });
    expect(commits).toStrictEqual(true);
  });

  test("We process labels unsuccessfully", async () => {
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    jest.spyOn(pullRequest, "listLabels").mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let commits = await runner.processLabels({
      labels: ["new", "feature-request"],
    });
    expect(commits).toStrictEqual(false);
  });
});

describe("processPrivilegedReviewer", () => {
  test("We process commits, diff and labels successfully with all options enabled", async () => {
    process.env["INPUT_CHECKCOMMITS"] = "true";
    process.env["INPUT_CHECKLABELS"] = "true";
    process.env["INPUT_CHECKDIFF"] = "true";
    process.env["INPUT_COMMITVERIFICATION"] = "false";
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    jest.spyOn(pullRequest, "listLabels").mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let prCommits = [
      { author: { login: "robot" }, verification: { verified: false } },
    ];
    jest.spyOn(pullRequest, "listCommits").mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let prDiff = `| diff --git a/.github/workflows/check-dist.yml b/.github/workflows/check-dist.yml
index 2f4e8d9..93c2072 100644
--- a/.github/workflows/check-dist.yml
+++ b/.github/workflows/check-dist.yml
@@ -44,7 +44,7 @@ jobs:
         id: diff
 
       # If index.js was different than expected, upload the expected version as an artifact
-      - uses: actions/upload-artifact@v2
         if: blah
         with:
           name: dist`;
    jest.spyOn(pullRequest, "getDiff").mockImplementation(() => prDiff);
    expect(pullRequest.getDiff()).toBe(prDiff);

    let processed = await runner.processPrivilegedReviewer("robot", {
      labels: ["bug", "feature-request"],
    });
    expect(processed).toStrictEqual(true);
  });

  test("We process commits unsuccessfully with the option enabled", async () => {
    process.env["INPUT_CHECKCOMMITS"] = "true";

    let prCommits = [
      { author: { login: "robot" }, verification: { verified: false } },
      { author: { login: "malicious" }, verification: { verified: false } },
    ];
    jest.spyOn(pullRequest, "listCommits").mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let processed = await runner.processPrivilegedReviewer("robot", {
      labels: ["bug", "feature-request"],
    });
    expect(processed).toStrictEqual(false);
  });

  test("We process commits unsuccessfully due to missing verification", async () => {
    process.env["INPUT_CHECKCOMMITS"] = "true";
    process.env["INPUT_COMMITVERIFICATION"] = "true";

    let prCommits = [
      { author: { login: "robot" }, verification: { verified: false } },
      { author: { login: "malicious" }, verification: { verified: false } },
    ];
    jest.spyOn(pullRequest, "listCommits").mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let processed = await runner.processPrivilegedReviewer("robot", {
      labels: ["bug", "feature-request"],
    });
    expect(processed).toStrictEqual(false);
  });

  test("We allow bad commits when the option to check them is not set", async () => {
    let prCommits = [
      { author: { login: "robot" } },
      { author: { login: "malicious" } },
    ];
    jest.spyOn(pullRequest, "listCommits").mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let processed = await runner.processPrivilegedReviewer("robot", {
      labels: [],
    });
    expect(processed).toStrictEqual(true);
  });

  test("We process labels unsuccessfully with the option enabled", async () => {
    process.env["INPUT_CHECKLABELS"] = "true";
    process.env["INPUT_COMMITVERIFICATION"] = "false";
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    jest.spyOn(pullRequest, "listLabels").mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let processed = await runner.processPrivilegedReviewer("robot", {
      labels: ["new", "feature-request"],
    });
    expect(processed).toStrictEqual(false);
  });

  test("We allow bad labels when the option to check them is not set", async () => {
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    jest.spyOn(pullRequest, "listLabels").mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let processed = await runner.processPrivilegedReviewer("robot", {
      labels: ["new", "feature-request"],
    });
    expect(processed).toStrictEqual(true);
  });

  test("We process the diff unsuccessfully with the option enabled", async () => {
    process.env["INPUT_CHECKDIFF"] = "true";
    process.env["INPUT_COMMITVERIFICATION"] = "false";
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
    jest.spyOn(pullRequest, "getDiff").mockImplementation(() => prDiff);
    expect(pullRequest.getDiff()).toBe(prDiff);

    let processed = await runner.processPrivilegedReviewer("robot", {
      labels: [],
    });
    expect(processed).toStrictEqual(false);
  });

  test("We allow a bad diff when the option to check them is not set", async () => {
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
    jest.spyOn(pullRequest, "getDiff").mockImplementation(() => prDiff);
    expect(pullRequest.getDiff()).toBe(prDiff);

    let processed = await runner.processPrivilegedReviewer("robot", {
      labels: [],
    });
    expect(processed).toStrictEqual(true);
  });
});
