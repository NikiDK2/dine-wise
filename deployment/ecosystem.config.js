module.exports = {
  apps: [{
    name: 'restoplanner',
    script: 'server.js',
    cwd: '/var/www/innovationstudio.be/RestPlanner',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
