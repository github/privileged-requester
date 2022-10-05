export { PrivilegedRequester };

const yaml = require("js-yaml");

class PrivilegedRequester {
  constructor(provider) {
    this.github = provider;
    this.requesters = false;
  }

  async getRequesters() {
    if (this.requesters === false) {
      const config = await this.github.getConfigContent();
      this.configContents = yaml.load(config);
      this.requesters = this.configContents["requesters"];
    }
    return this.requesters;
  }
}
