const config = {
  apiUrl:
    process.env.VUE_APP_API_URL ||
    (window.location.protocol === 'https:'
      ? `https://${window.location.hostname}`
      : `http://${window.location.hostname}:3000`),
};

export default config;
