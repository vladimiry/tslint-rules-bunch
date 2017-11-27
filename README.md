# tslint-rules-bunch

is a module that contains a set of the [tslint](https://github.com/palantir/tslint) rules.

## Rules

### `no-import-zones`

Forbids specific imports for the specified targets using [micromatch](https://github.com/micromatch/micromatch) patterns matching.

Imagine you have the following directory structure:
```
└── project
    ├── dist
    ├── src
    │   ├── lib
    │   └── test
    └── tslint.json
```
You keep the built/compiled/transpiled/release code in the `dist` directory, source code in `src/lib` and tests code in `src/test`. For example you want to make sure that code under `src/test` directory doesn't import anything from the `src/lib` as you want tests code does import only from the `dist` (release code). But as an exclusion you want to allow tests code import stuff from the `src/lib/module-1`. You can enforce such scenario putting the `no-import-zones` rule into your `tslint.json`:
```json
  "rules": {
    "no-import-zones": [
      true,
      {
        "basePath": "src",
        "verbose": true,
        "zones": [
          {
            "patterns": [
              {
                "target": "test/**/*",
                "from": [
                  "lib",
                  "lib/**/*",
                  "!lib/module-1"
                ]
              }
            ]
          }
        ]
      }
    ]
  }
```
Above code related notes:
- `basePath`: defines the base path value that is used for resolving `<pattern object>.target` and `<pattern object>.from` values relative to the `process.cwd()`. It can be set on the top level and also on the specific zone level. The property is optional, by default `process.cwd()` is used as the base path value.
- `verbose`: flag value that toggles detailed failure output, default value is `undefined`, means `false`;
- `<pattern object>.target`: can be a single value or array of the path pattern to which the forbidding logic should be applied.
- `<pattern object>.from`: can be a single value or array of the import patterns that are not allowed to be used by the files matched against the `<pattern object>.target` pattern.
