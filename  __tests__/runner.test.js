import { GitHubProvider } from "../src/github-provider";
import { PrivilegedRequester } from "../src/privileged-requester";
import { PullRequest } from "../src/pull-request";
import { Runner } from "../src/runner";
import * as core from "@actions/core";

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

describe("processCommits", () => {
  test("We process commits successfully", async () => {
    let prCommits = [{ author: { login: "robot" } }];
    let spy = jest
      .spyOn(pullRequest, "listCommits")
      .mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processCommits("robot");
    expect(commits).toStrictEqual(true);
  });

  test("We process commits unsuccessfully", async () => {
    let prCommits = [
      { author: { login: "robot" } },
      { author: { login: "danhoerst" } },
    ];
    let spy = jest
      .spyOn(pullRequest, "listCommits")
      .mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processCommits("robot");
    expect(commits).toStrictEqual(false);
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
    let spy = jest
      .spyOn(pullRequest, "listLabels")
      .mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let commits = await runner.processLabels({
      labels: ["bug", "feature-request"],
    });
    expect(commits).toStrictEqual(true);
  });

  test("We process labels unsuccessfully", async () => {
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    let spy = jest
      .spyOn(pullRequest, "listLabels")
      .mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let commits = await runner.processLabels({
      labels: ["new", "feature-request"],
    });
    expect(commits).toStrictEqual(false);
  });
});

describe("processPrivilegedReviewer", () => {
  test("We process commits and labels successfully with all options enabled", async () => {
    process.env["INPUT_CHECKCOMMITS"] = "true";
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    let spyLabels = jest
      .spyOn(pullRequest, "listLabels")
      .mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let prCommits = [{ author: { login: "robot" } }];
    let spyCommits = jest
      .spyOn(pullRequest, "listCommits")
      .mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processPrivilegedReviewer("robot", {
      labels: ["bug", "feature-request"],
    });
    expect(commits).toStrictEqual(true);
    process.env["INPUT_CHECKCOMMITS"] = "";
  });

  test("We process commits unsuccessfully with the option enabled", async () => {
    process.env["INPUT_CHECKCOMMITS"] = "true";
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    let spyLabels = jest
      .spyOn(pullRequest, "listLabels")
      .mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let prCommits = [
      { author: { login: "robot" } },
      { author: { login: "malicious" } },
    ];
    let spyCommits = jest
      .spyOn(pullRequest, "listCommits")
      .mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processPrivilegedReviewer("robot", {
      labels: ["bug", "feature-request"],
    });
    expect(commits).toStrictEqual(false);
    process.env["INPUT_CHECKCOMMITS"] = "";
  });

  test("We allow bad commits when the option to check them is not set", async () => {
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    let spyLabels = jest
      .spyOn(pullRequest, "listLabels")
      .mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let prCommits = [
      { author: { login: "robot" } },
      { author: { login: "malicious" } },
    ];
    let spyCommits = jest
      .spyOn(pullRequest, "listCommits")
      .mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processPrivilegedReviewer("robot", {
      labels: ["bug", "feature-request"],
    });
    expect(commits).toStrictEqual(true);
  });

  test("We process labels unsuccessfully with the option enabled", async () => {
    process.env["INPUT_CHECKLABELS"] = "true";
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    let spyLabels = jest
      .spyOn(pullRequest, "listLabels")
      .mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let prCommits = [{ author: { login: "robot" } }];
    let spyCommits = jest
      .spyOn(pullRequest, "listCommits")
      .mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processPrivilegedReviewer("robot", {
      labels: ["new", "feature-request"],
    });
    expect(commits).toStrictEqual(false);
    process.env["INPUT_CHECKLABELS"] = "";
  });

  test("We allow bad commits when the option to check them is not set", async () => {
    let prLabels = [{ name: "bug" }, { name: "feature-request" }];
    let spyLabels = jest
      .spyOn(pullRequest, "listLabels")
      .mockImplementation(() => prLabels);
    expect(pullRequest.listLabels()).toBe(prLabels);

    let prCommits = [{ author: { login: "robot" } }];
    let spyCommits = jest
      .spyOn(pullRequest, "listCommits")
      .mockImplementation(() => prCommits);
    expect(pullRequest.listCommits()).toBe(prCommits);

    let commits = await runner.processPrivilegedReviewer("robot", {
      labels: ["new", "feature-request"],
    });
    expect(commits).toStrictEqual(true);
  });
});
