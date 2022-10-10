const nock = require("nock");
const { GitHubProvider } = require("./github-provider");

test("It creates an approved review", async () => {
  process.env["GITHUB_REPOSITORY"] = "foo/bar";

  nock("https://api.github.com")
    .persist()
    .post("/repos/foo/bar/pulls/1/reviews", '{"event":"APPROVE"}')
    .reply(200);

  let provider = new GitHubProvider("token");
  await provider.createReview(1, "APPROVE");
});

test("It gets the config content", async () => {
  process.env["GITHUB_REPOSITORY"] = "foo/bar";
  process.env["INPUT_PATH"] = "config/xyz.yml";

  nock("https://api.github.com")
    .persist()
    .get("/repos/foo/bar/contents/config%2Fxyz.yml")
    .reply(200);

  let provider = new GitHubProvider("token");
  await provider.getConfigContent();
});

test("It lists commits on a PR", async () => {
  process.env["GITHUB_REPOSITORY"] = "foo/bar";

  nock("https://api.github.com")
    .persist()
    .get("/repos/foo/bar/pulls/1/commits")
    .reply(200);

  let provider = new GitHubProvider("token");
  await provider.listPRCommits(1);
});

test("It lists labels on a PR", async () => {
  process.env["GITHUB_REPOSITORY"] = "foo/bar";

  nock("https://api.github.com")
    .persist()
    .get("/repos/foo/bar/issues/1/labels")
    .reply(200);

  let provider = new GitHubProvider("token");
  await provider.listLabelsOnPR(1);
});
