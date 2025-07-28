import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// refer: https://github.com/colinhacks/zshy/blob/main/src/tx-extension-rewrite.ts#L6
export const createExtensionRewriteTransformer =
	(config: { ext: string }): ts.TransformerFactory<ts.SourceFile | ts.Bundle> =>
	context => {
		return sourceFile => {
			const visitor = (node: ts.Node): ts.Node => {
				const isImport = ts.isImportDeclaration(node);
				const isExport = ts.isExportDeclaration(node);
				const isDynamicImport =
					ts.isCallExpression(node) &&
					node.expression.kind === ts.SyntaxKind.ImportKeyword;

				let originalText: string;
				if (isImport || isExport || isDynamicImport) {
					if (isImport || isExport) {
						if (
							!node.moduleSpecifier ||
							!ts.isStringLiteral(node.moduleSpecifier)
						) {
							return ts.visitEachChild(node, visitor, context);
						}

						originalText = node.moduleSpecifier.text;
					} else if (isDynamicImport) {
						const arg = node.arguments[0]!;
						if (!ts.isStringLiteral(arg)) {
							// continue
							return ts.visitEachChild(node, visitor, context);
						}
						originalText = arg.text;
					} else {
						// If it's not an import, export, or dynamic import, just visit children
						return ts.visitEachChild(node, visitor, context);
					}

					const isRelativeImport =
						originalText.startsWith("./") || originalText.startsWith("../");
					if (!isRelativeImport) {
						// If it's not a relative import, don't transform it
						return node;
					}

					const ext = path.extname(originalText).toLowerCase();

					// rewrite .js to resolved js extension
					if (ext === ".js" || ext === ".ts") {
						const newText = originalText.slice(0, -3) + config.ext;
						if (isImport) {
							return ts.factory.updateImportDeclaration(
								node,
								node.modifiers,
								node.importClause,
								ts.factory.createStringLiteral(newText),
								node.assertClause,
							);
						} else if (isExport) {
							return ts.factory.updateExportDeclaration(
								node,
								node.modifiers,
								node.isTypeOnly,
								node.exportClause,
								ts.factory.createStringLiteral(newText),
								node.assertClause,
							);
						} else if (isDynamicImport) {
							return ts.factory.updateCallExpression(
								node,
								node.expression,
								node.typeArguments,
								[
									ts.factory.createStringLiteral(newText),
									...node.arguments.slice(1),
								],
							);
						}
					}

					// rewrite extensionless imports to .js
					if (ext === "") {
						// Check filesystem to determine if we should resolve to file.ts or directory/index.ts
						let newText = originalText + config.ext;

						if (ts.isSourceFile(sourceFile)) {
							const sourceFileDir = path.dirname(sourceFile.fileName);
							const resolvedPath = path.resolve(sourceFileDir, originalText);

							// Check if the extensionless import refers to a file (e.g., d.ts)
							const potentialFile = resolvedPath + ".ts";
							const potentialIndexFile = path.join(resolvedPath, "index.ts");

							if (
								fs.existsSync(potentialIndexFile) &&
								!fs.existsSync(potentialFile)
							) {
								// Directory with index.ts exists, use index path
								newText = originalText + "/index" + config.ext;
							}
							// Otherwise, use the default behavior (originalText + config.ext)
						}

						if (isImport) {
							return ts.factory.updateImportDeclaration(
								node,
								node.modifiers,
								node.importClause,
								ts.factory.createStringLiteral(newText),
								node.assertClause,
							);
						} else if (isExport) {
							return ts.factory.updateExportDeclaration(
								node,
								node.modifiers,
								node.isTypeOnly,
								node.exportClause,
								ts.factory.createStringLiteral(newText),
								node.assertClause,
							);
						} else if (isDynamicImport) {
							return ts.factory.updateCallExpression(
								node,
								node.expression,
								node.typeArguments,
								[
									ts.factory.createStringLiteral(newText),
									...node.arguments.slice(1),
								],
							);
						}
					}
				}

				return ts.visitEachChild(node, visitor, context);
			};

			return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
		};
	};
