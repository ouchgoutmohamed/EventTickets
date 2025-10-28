const app = require('./app');

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🎫 SIBE - Service Utilisateur                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ User Service running on port ${PORT}               ║`);
  console.log(`║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                   ║`);
  console.log(`║  📡 URL: http://localhost:${PORT}                       ║`);
  console.log('╚════════════════════════════════════════════════════════╝');
});
