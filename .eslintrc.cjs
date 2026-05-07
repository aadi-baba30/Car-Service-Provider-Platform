module.exports = {
  plugins: ['@firebase/security-rules'],
  overrides: [
    {
      files: ['*.rules'],
      extends: ['plugin:@firebase/security-rules/recommended']
    }
  ]
};
