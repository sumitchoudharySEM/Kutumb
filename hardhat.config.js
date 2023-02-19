require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.7",
    defaultNetwork: "hyperspace",
    networks: {
      hyperspace: {
          chainId: 3141,
          url: "https://api.hyperspace.node.glif.io/rpc/v1",
          accounts: ["83057b7c1ead7f657211964e5cece6b1df54842fdc47edaaa20c63e1f9892942"],
      },
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
