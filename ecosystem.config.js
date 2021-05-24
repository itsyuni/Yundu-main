module.exports = {
    apps : [{
      name: "schoolspace",
      script: "./index.js",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }]
  }