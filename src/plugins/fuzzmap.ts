import template, { program } from "@babel/template";
import { NodePath, PluginObj, PluginPass } from "@babel/core";
import {
  isJSXAttribute,
  isJSXExpressionContainer,
  isJSXIdentifier,
  isFunctionExpression,
  isArrowFunctionExpression,
  isIdentifier,
  isBlockStatement,
  numericLiteral,
  returnStatement,
  blockStatement,
  JSXOpeningElement,
} from "@babel/types";

let curr_hit_id = 0;
const processed = new Set();

const fuzzmap_plugin = (): PluginObj<PluginPass> => {
  return {
    name: "fuzzmap",
    visitor: {
      BlockStatement(path) {
        const node_id = path.node.start;
        if (processed.has(node_id)) {
          return;
        }
        const hit = template(
          `
            // if (typeof window !== 'undefined') {
              if (window.Fuzzer) {
                window.Fuzzer.hit(HIT_ID);
              }
            // }
          `
        )({
          HIT_ID: numericLiteral(curr_hit_id++),
        });
        // save newly made hit() template node ids to processed:
        if (hit instanceof Array) {
          hit.forEach((node) => {
            processed.add(node.start);
          });
        } else {
          processed.add(hit.start);
        }
        // console.log('added block stmt', path)
        path.unshiftContainer("body", hit);
        // processed.add(node_id);
      },
      JSXOpeningElement(path: NodePath<JSXOpeningElement>) {
        path.node.attributes.forEach((attribute) => {
          if (
            isJSXAttribute(attribute) &&
            isJSXIdentifier(attribute.name) &&
            attribute.name.name === "onClick"
          ) {
            if (attribute.value && isJSXExpressionContainer(attribute.value)) {
              const expression = attribute.value.expression;
              // console.log("i am concise body", expression);
              // Handle anonymous functions with concise body
              if (
                isArrowFunctionExpression(expression) &&
                !isBlockStatement(expression.body)
                ) {
                console.log('anonymous concise body', expression.body)
                const hitStatements = template.statements(`
                  // console.log('anonymous concise body');
                  if (typeof window !== 'undefined' && window.Fuzzer) {
                    window.Fuzzer.hit(HIT_ID);
                  }
                `)({ HIT_ID: numericLiteral(curr_hit_id++) });

                expression.body = blockStatement([
                  ...hitStatements,
                  returnStatement(expression.body),
                ]);
                expression.expression = false; // Convert from concise body to block body
              }
              // Handle anonymous functions (FunctionExpression or ArrowFunctionExpression) with block body
              else if (
                isFunctionExpression(expression) ||
                (isArrowFunctionExpression(expression) &&
                  isBlockStatement(expression.body))
              ) {
                console.log("anonymous block body", expression);
                const hitStatement = template.statement(`
                  // console.log('anonymous block body');
                  if (typeof window !== 'undefined' && window.Fuzzer) {
                    window.Fuzzer.hit(HIT_ID);
                  }
                `)({ HIT_ID: numericLiteral(curr_hit_id++) });

                expression.body.body.unshift(hitStatement);
              }

              // Handle named functions (Identifier)
              else if (isIdentifier(expression)) {
                console.log("named function", expression);
                const hitStatement = template.expression(`
                  function() {
                    // console.log('named function');
                    if (typeof window !== 'undefined' && window.Fuzzer) {
                      window.Fuzzer.hit(HIT_ID);
                    }
                    return ORIGINAL_IDENTIFIER();
                  }
                `)({
                  HIT_ID: numericLiteral(curr_hit_id++),
                  ORIGINAL_IDENTIFIER: expression,
                });

                attribute.value.expression = hitStatement;
              }
            }
          }
        });
      },
    },
  };
};

export default fuzzmap_plugin;
