import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { FlatCompat } from "@eslint/eslintrc";
import pluginN from "eslint-plugin-n";
import pluginJson from "@eslint/json";
import pluginPrettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const baseDirectory = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
	baseDirectory,
	resolvePluginsRelativeTo: baseDirectory,
});

export default [
	{
		ignores: [
			"**/node_modules/**",
			"**/build/**",
			"**/dist/**",
			"**/doc/**",
			"**/public/**",
			"**/.claude/**",
			"eslint.config.mjs",
		],
	},
	...compat.extends("airbnb").map((config) => ({
		...config,
		files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
	})),
	{
		...pluginN.configs["flat/recommended"],
		files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
	},
	{
		files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
		plugins: {
			prettier: pluginPrettier,
		},
		languageOptions: {
			sourceType: "module",
			ecmaVersion: "latest",
			globals: {
				...globals.node,
				...globals.mocha,
				...globals.jest,
			},
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			"prettier/prettier": "error",
			"global-require": "off",
			"no-console": "off",
			"func-names": "off",
			"no-process-exit": "off",
			"no-continue": "off",
			"import/extensions": ["error", "ignorePackages"],
			"no-param-reassign": "off",
			"no-underscore-dangle": "off",
			"no-await-in-loop": "off",
			"n/no-unsupported-features/es-syntax": [
				"error",
				{ ignores: ["modules", "dynamicImport"] },
			],
			"no-plusplus": [
				"error",
				{
					allowForLoopAfterthoughts: true,
				},
			],
			"no-restricted-syntax": [
				"error",
				{
					selector: "ForInStatement",
					message:
						"for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
				},
				{
					selector: "LabeledStatement",
					message:
						"Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
				},
				{
					selector: "WithStatement",
					message:
						"`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
				},
			],
			"import/no-named-as-default-member": "off",
			"import/no-extraneous-dependencies": [
				"error",
				{
					devDependencies: ["**/tests/**"],
				},
			],
			"n/no-unpublished-require": "off",
			"n/no-unpublished-import": "off",
			"class-methods-use-this": "off",
			"no-control-regex": "off",
		},
	},
	prettierConfig,
	{
		...pluginJson.configs.recommended,
		files: ["**/*.json"],
		language: "json/json",
		plugins: {
			...pluginJson.configs.recommended.plugins,
			prettier: pluginPrettier,
		},
		rules: {
			...pluginJson.configs.recommended.rules,
			"prettier/prettier": "error",
		},
	},
	{
		...pluginJson.configs.recommended,
		files: ["**/*.jsonc"],
		language: "json/jsonc",
		plugins: {
			...pluginJson.configs.recommended.plugins,
			prettier: pluginPrettier,
		},
		rules: {
			...pluginJson.configs.recommended.rules,
			"prettier/prettier": "error",
		},
	},
];
