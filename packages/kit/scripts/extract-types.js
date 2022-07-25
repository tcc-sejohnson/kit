import fs from 'fs';
import ts from 'typescript';
import prettier from 'prettier';
import { mkdirp } from '../src/utils/filesystem.js';
import { fileURLToPath } from 'url';

/** @typedef {{ name: string, comment: string, snippet: string }} Extracted */

/** @type {Array<{ name: string, comment: string, exports: Extracted[], types: Extracted[], exempt?: boolean }>} */
const modules = [];

/**
 * @param {string} code
 * @param {ts.NodeArray<ts.Statement>} statements
 */
function get_types(code, statements) {
	/** @type {Extracted[]} */
	const exports = [];

	/** @type {Extracted[]} */
	const types = [];

	if (statements) {
		for (const statement of statements) {
			if (
				ts.isClassDeclaration(statement) ||
				ts.isInterfaceDeclaration(statement) ||
				ts.isTypeAliasDeclaration(statement) ||
				ts.isModuleDeclaration(statement) ||
				ts.isVariableStatement(statement) ||
				ts.isFunctionDeclaration(statement)
			) {
				const name_node = ts.isVariableStatement(statement)
					? statement.declarationList.declarations[0]
					: statement;

				// @ts-ignore no idea why it's complaining here
				const name = name_node.name?.escapedText;

				let start = statement.pos;
				let comment = '';

				// @ts-ignore i think typescript is bad at typescript
				if (statement.jsDoc) {
					// @ts-ignore
					comment = statement.jsDoc[0].comment;
					// @ts-ignore
					start = statement.jsDoc[0].end;
				}

				const i = code.indexOf('export', start);
				start = i + 6;

				const snippet = prettier.format(code.slice(start, statement.end).trim(), {
					parser: 'typescript',
					printWidth: 80,
					useTabs: true,
					singleQuote: true,
					trailingComma: 'none'
				});

				const collection =
					ts.isVariableStatement(statement) || ts.isFunctionDeclaration(statement)
						? exports
						: types;

				collection.push({ name, comment, snippet });
			} else {
				// console.log(statement.kind);
			}
		}

		types.sort((a, b) => (a.name < b.name ? -1 : 1));
		exports.sort((a, b) => (a.name < b.name ? -1 : 1));
	}

	return { types, exports };
}

{
	const code = fs.readFileSync('types/index.d.ts', 'utf-8');
	const node = ts.createSourceFile('index.d.ts', code, ts.ScriptTarget.Latest);

	modules.push({
		name: '@sveltejs/kit',
		comment: 'The following types can be imported from `@sveltejs/kit`:',
		...get_types(code, node.statements)
	});
}

{
	const code = fs.readFileSync('types/private.d.ts', 'utf-8');
	const node = ts.createSourceFile('private.d.ts', code, ts.ScriptTarget.Latest);

	modules.push({
		name: 'Additional types',
		comment:
			'The following are referenced by the public types documented above, but cannot be imported directly:',
		...get_types(code, node.statements)
	});
}

const dir = fileURLToPath(new URL('./special-types', import.meta.url).href);
for (const file of fs.readdirSync(dir)) {
	if (!file.endsWith('.md')) continue;

	const comment = fs
		.readFileSync(`${dir}/${file}`, 'utf-8')
		.replace(/https:\/\/kit\.svelte\.dev/g, '');

	modules.push({
		name: file.replace(/\+/g, '/').slice(0, -3),
		comment,
		exports: [],
		types: [],
		exempt: true
	});
}

{
	const code = fs.readFileSync('types/ambient.d.ts', 'utf-8');
	const node = ts.createSourceFile('ambient.d.ts', code, ts.ScriptTarget.Latest);

	for (const statement of node.statements) {
		if (ts.isModuleDeclaration(statement)) {
			// @ts-ignore
			const name = statement.name.text || statement.name.escapedText;

			// @ts-ignore
			const comment = statement.jsDoc?.[0].comment ?? '';

			modules.push({
				name,
				comment: comment.replace(/https:\/\/kit\.svelte\.dev/g, ''),
				// @ts-ignore
				...get_types(code, statement.body?.statements)
			});
		}
	}
}

modules.sort((a, b) => (a.name < b.name ? -1 : 1));

mkdirp('docs');
fs.writeFileSync(
	'docs/types.js',
	`
/* This file is generated by running \`node scripts/extract-types.js\`
   in the packages/kit directory — do not edit it */
export const modules = ${JSON.stringify(modules, null, '  ')};
`.trim()
);
