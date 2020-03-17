import path from "path";
import spawnAsync, {SpawnResult} from "@expo/spawn-async";
import test from "ava";

const projectRootDirectory = path.resolve(process.cwd());
const tslintRulesDirectory = path.join(projectRootDirectory, "./dist/rules");

test("test", async (t) => {
    const projectBasePath = path.resolve(__dirname, "./fixtures/project-1");
    const projectConfigFile = path.join(projectBasePath, "./tslint.json");
    const projectScanPattern = path.join(projectBasePath, "./src/test", "/**/*.ts");

    const {stdout, status} = await t.throwsAsync(
        spawnAsync(
            "npx",
            [
                "tslint",
                ...["-c", projectConfigFile],
                ...["-p", path.join(projectRootDirectory, "./tsconfig.json")],
                ...["-r", tslintRulesDirectory],
                projectScanPattern,
            ],
            {cwd: projectBasePath},
        ),
    ) as unknown as Pick<SpawnResult, "stdout" | "status">;
    const [, ...errorLines] = (stdout)
        .split("\n")
        .filter((line) => Boolean(line));
    const expectedErrorLines = [
        // tslint:disable:max-line-length
        `ERROR: 1:10   no-import-zones  "../../../project-1/src/lib" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib"}`,
        `ERROR: 2:10   no-import-zones  "../../src/lib" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib"}`,
        `ERROR: 4:10   no-import-zones  "../lib" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib"}`,
        `ERROR: 5:10   no-import-zones  "src/lib" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib"}`,
        `ERROR: 7:10   no-import-zones  "../lib/index" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib/index"}`,
        `ERROR: 8:10   no-import-zones  "src/lib/index" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib/index"}`,
        `ERROR: 13:10  no-import-zones  "../lib/module-3/lib-1/lib-2" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib/module-3/lib-1/lib-2"}`,
        `ERROR: 14:10  no-import-zones  "src/lib/module-3/lib-1/lib-2" import is forbidden; rule: {"basePath":"src","target":"test/**/*","from":["lib","lib/**/*","!lib/module-1"]}; resolved values: {"file":"test/test-1.ts","import":"lib/module-3/lib-1/lib-2"}`,
        // tslint:enable:max-line-length
    ];

    t.true(typeof status === "number" && status > 0, "status > 0");
    t.deepEqual(errorLines, expectedErrorLines);
});
