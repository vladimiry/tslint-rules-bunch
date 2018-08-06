import * as path from "path";
import {test} from "ava";
import * as bufferedSpawn from "buffered-spawn";

const projectRootDirectory = path.resolve(process.cwd());
const tslintCli = path.resolve(projectRootDirectory, "./node_modules/.bin/tslint");
const tslintRulesDirectory = path.join(projectRootDirectory, "./dist/rules");

test("test", async (t) => {
    const basePath = path.resolve(__dirname, "./fixtures/project-1");
    const configFile = path.join(basePath, "./tslint.json");
    const scanPattern = path.join(basePath, "./src/test", "/**/*.ts");

    const tslintArgs = [
        tslintCli,
        ...["-c", configFile],
        ...["-p", path.join(projectRootDirectory, "./tsconfig.json")],
        ...["-r", tslintRulesDirectory],
        scanPattern,
    ];

    const {stdout}: { stdout: string } = await t.throws(bufferedSpawn(`node`, tslintArgs, {cwd: basePath}));
    const errorLines = (stdout)
        .split("\n")
        .filter((line) => !!line);
    const expectedErrorLines = [
        // tslint:disable:max-line-length
        `ERROR: ${basePath}/src/test/test-1.ts[1, 10]: (no-import-zones): "../../../project-1/src/lib" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib"}`,
        `ERROR: ${basePath}/src/test/test-1.ts[2, 10]: (no-import-zones): "../../src/lib" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib"}`,
        `ERROR: ${basePath}/src/test/test-1.ts[4, 10]: (no-import-zones): "../lib" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib"}`,
        `ERROR: ${basePath}/src/test/test-1.ts[5, 10]: (no-import-zones): "src/lib" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib"}`,
        `ERROR: ${basePath}/src/test/test-1.ts[7, 10]: (no-import-zones): "../lib/index" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib/index"}`,
        `ERROR: ${basePath}/src/test/test-1.ts[8, 10]: (no-import-zones): "src/lib/index" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib/index"}`,
        `ERROR: ${basePath}/src/test/test-1.ts[13, 10]: (no-import-zones): "../lib/module-3/lib-1/lib-2" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib/module-3/lib-1/lib-2"}`,
        `ERROR: ${basePath}/src/test/test-1.ts[14, 10]: (no-import-zones): "src/lib/module-3/lib-1/lib-2" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib/module-3/lib-1/lib-2"}`,
        // tslint:enable:max-line-length
    ];

    t.deepEqual(errorLines, expectedErrorLines);
});
