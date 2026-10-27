module.exports = ({ config }) => {
  const override = process.env.HIMA_APK_VERSION_CODE;
  if (!override) return config;
  if (!/^[1-9]\d*$/.test(override) || Number(override) > 2100000000) {
    throw new Error('HIMA_APK_VERSION_CODE must be an integer between 1 and 2100000000.');
  }
  return { ...config, android: { ...config.android, versionCode: Number(override) } };
};
