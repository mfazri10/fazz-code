module.exports = {
  apps: [
    {
      name: "fazz-code",
      script: "npm",
      args: "start",
      cwd: "/root/fazz-code",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: ".env.production",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
