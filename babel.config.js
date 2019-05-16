module.exports = function(api) {
  api.cache(true);

  const presets = [
    '@babel/preset-flow',
    [
      '@babel/preset-env', {
        targets: 'node >= 8'
      }
    ]
  ];
  const plugins = [
    '@babel/plugin-proposal-class-properties',
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
