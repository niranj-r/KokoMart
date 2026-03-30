export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET,
  },
});
