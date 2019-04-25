exports.presets = [
  [
    "@babel/env",
    {
      targets: {
        node: 'current'
      },
      useBuiltIns: "usage",
      corejs: 3
    },
  ],
];

exports.plugins = [
  [
    "@babel/plugin-transform-runtime",
    {
      "absoluteRuntime": false,
      "corejs": false,
      "helpers": true,
      "regenerator": true,
      "useESModules": false
    }
  ]
];