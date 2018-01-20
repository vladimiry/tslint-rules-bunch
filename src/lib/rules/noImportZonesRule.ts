// tslint:disable:object-literal-sort-keys

import * as path from "path";
import * as Lint from "tslint";
import * as ts from "typescript";
import * as mm from "micromatch";
import {findImports, ImportKind} from "tsutils";

const camelCasedRuleFileName = path.parse(__filename).name;
const dashedRuleFileName = camelToDash(camelCasedRuleFileName);
const dashedRuleName = dashedRuleFileName.replace(/-rule$/, "");

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: Lint.IRuleMetadata = {
        ruleName: dashedRuleName,
        description: `Forbids specific imports for the specified targets using "micromatch" patterns matching`,
        optionsDescription: Lint.Utils.dedent`
            * "basePath": by default "process.cwd()" is used as the base path, but custom "basePath"
            property can be specified on the both zone/top and specific item levels. If values are specified on the
            both levels, then specific item's value takes the priority.
            * "patterns" object specifies:
                * "target": file name pattern to which forbidding rule will be applied
                * "from": file import pattern that will be from for the specified "target"
            * "verbose": verbose output
        `,
        options: {
            type: "object",
            required: ["zones"],
            additionalProperties: false,
            properties: {
                basePath: {type: ["string", "null"]},
                zones: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["patterns"],
                        additionalProperties: false,
                        properties: {
                            basePath: {type: ["string", "null"]},
                            patterns: {
                                type: "array",
                                items: {
                                    type: "object",
                                    required: ["target", "from"],
                                    additionalProperties: false,
                                    properties: {
                                        target: {
                                            anyOf: [
                                                {type: "string"},
                                                {type: "array", items: {type: "string"}},
                                            ],
                                        },
                                        from: {
                                            anyOf: [
                                                {type: "string"},
                                                {type: "array", items: {type: "string"}},
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        optionExamples: [
            true,
            [
                {
                    basePath: "src",
                    zones: [
                        {
                            patterns: [
                                {
                                    target: "test/**/*",
                                    from: "lib/**/*",
                                },
                            ],
                        },
                    ],
                },
            ],
        ],
        type: "functionality",
        typescriptOnly: false,
    };

    public isEnabled(): boolean {
        return super.isEnabled() && this.ruleArguments.length > 0;
    }

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithFunction<Options[]>(sourceFile, walk, this.ruleArguments);
    }
}

function walk(ctx: Lint.WalkContext<Options[]>) {
    for (const importUnit of findImports(ctx.sourceFile, ImportKind.All)) {
        for (const {basePath: topLevelBasePath, zones, verbose} of ctx.options) {
            for (const {basePath: zoneBasePath, patterns} of zones) {
                const basePath = zoneBasePath
                    ? resolveBasePath(zoneBasePath)
                    : topLevelBasePath
                        ? resolveBasePath(topLevelBasePath)
                        : path.resolve(process.cwd());

                const srcFile = path.resolve(path.resolve(ctx.sourceFile.fileName));
                const srcFileDir = path.parse(srcFile).dir;

                const importFile = importUnit.text.startsWith(".")
                    ? path.resolve(srcFileDir, importUnit.text)
                    : importUnit.text;

                const relativeSrcFile = path.relative(basePath, srcFile);
                const relativeImportFile = path.relative(basePath, importFile);

                for (const {target, from} of patterns) {
                    if (mm([relativeSrcFile], target).length && mm([relativeImportFile], from).length) {
                        const zone: OptionsZoneError = {basePath, target, from};
                        const messages = [
                            `(${Rule.metadata.ruleName}): "${importUnit.text}" import is forbidden`,
                        ];

                        if (verbose) {
                            messages.push(...[
                                `; rule: ${JSON.stringify(zone)}; resolved values: ${JSON.stringify({
                                    file: relativeSrcFile,
                                    import: relativeImportFile,
                                })}`,
                            ]);
                        }

                        ctx.addFailure(importUnit.getStart(ctx.sourceFile) + 1, importUnit.end - 1, messages.join(""));
                    }
                }
            }
        }
    }
}

interface Options extends Partial<OptionsBasePath> {
    verbose?: boolean;
    zones: OptionsZone[];
}

interface OptionsZone extends Partial<OptionsBasePath> {
    patterns: OptionsZonePattern[];
}

interface OptionsZonePattern {
    target: string | string[];
    from: string | string[];
}

interface OptionsZoneError extends OptionsZonePattern, OptionsBasePath {}

interface OptionsBasePath {
    basePath: string;
}

function resolveBasePath(basePath: string) {
    return path.isAbsolute(basePath)
        ? basePath
        : path.relative(process.cwd(), basePath);
}

function camelToDash(str: string) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
