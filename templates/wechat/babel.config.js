module.exports = function(api) {
  api.cache(true);

  const presets = [
    '@babel/preset-env'
  ];
  const plugins = [
    [
      '@babel/plugin-transform-runtime', {
        "absoluteRuntime": false,
        "corejs": 3,
        "helpers": true,
        "regenerator": true,
        "useESModules": false
      }
    ]
  ];

  return {
    presets,
    plugins
  };
}
