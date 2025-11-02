export default ({ config }) => ({
  ...config,
  name: 'EduScrum',
  slug: 'eduscrum-frontend',
  version: '1.0.0',
  extra: {
    apiUrl: process.env.API_URL || 'http://localhost:5000',
    socketUrl: process.env.SOCKET_URL || 'http://localhost:5000',
  },
});