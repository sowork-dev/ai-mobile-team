module.exports = {
  apps: [{
    name: "ai-mobile-team",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
    },
    env_file: ".env",
  }]
};
