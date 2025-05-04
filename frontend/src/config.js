const config = {
  apiUrl:
    process.env.VUE_APP_API_URL ||
    (window.location.protocol === 'https:'
      ? `https://${window.location.host}`
      : 'http://localhost:3000'),
};

export default config;
