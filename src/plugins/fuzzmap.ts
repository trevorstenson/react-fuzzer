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
  stringLiteral,
  returnStatement,
  blockStatement,
  JSXOpeningElement,
  isLogicalExpression,
  // callExpression,
  // memberExpression,
  // identifier,
  logicalExpression,
  sequenceExpression,
  jsxExpressionContainer,
} from "@babel/types";

const next_fuzzer_stmt = (type?: string) => {
  return template.statement(
    `
    // if (typeof window !== 'undefined') {
      if (window.Fuzzer) {
        window.Fuzzer.hit(HIT_ID, TYPE);
      }
      // }
    `
  )({
    HIT_ID: numericLiteral(curr_hit_id++),
   TYPE: stringLiteral(type || ''),
  });
};

let curr_hit_id = 0;
const processed = new Set();
const click_handler_stack: boolean[] = [];

const fuzzmap_plugin = (): PluginObj<PluginPass> => {
  return {
    name: "fuzzmap",
    visitor: {
      BlockStatement(path) {
        const node_id = path.node.start;
        if (processed.has(node_id)) {
          return;
        }
        let hit;
        if (click_handler_stack.length === 0) {
          // console.log("not in ch stack!!!!", path.toString());
          hit = next_fuzzer_stmt('load');
        } else {
          hit = next_fuzzer_stmt();
        }
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
      JSXExpressionContainer(path) {
        const expr = path.node.expression;
        if (!(isLogicalExpression(expr) && expr.operator === "&&")) return;
        if (processed.has(expr)) return;
        processed.add(expr);
        // convert: expr && <jsx>
        // to: expr && (window.Fuzzer && window.Fuzzer.hit(HIT_ID) && <jsx>)
        const hit_expr = template.expression(
          `(window.Fuzzer && window.Fuzzer.hit(HIT_ID))`
        )({
          HIT_ID: numericLiteral(curr_hit_id++),
        });
        const new_expr = logicalExpression(
          "&&",
          expr.left,
          sequenceExpression([hit_expr, expr.right])
        );
        processed.add(new_expr);
        // Replace the existing JSX expression container with the new logical expression
        path.replaceWith(jsxExpressionContainer(new_expr));
      },
      JSXOpeningElement(path: NodePath<JSXOpeningElement>) {
        const on_click_attr = path.node.attributes.find(
          (attr) =>
            isJSXAttribute(attr) &&
            isJSXIdentifier(attr.name) &&
            attr.name.name === "onClick"
        );
        if (on_click_attr) {
          click_handler_stack.push(true);
          path.traverse({
            JSXAttribute(attr_path) {
              if (attr_path.node === on_click_attr) {
                attr_path.stop();
              }
            },
            exit() {
              click_handler_stack.pop();
            },
          });
        }
        path.node.attributes.forEach((attribute) => {
          if (
            isJSXAttribute(attribute) &&
            isJSXIdentifier(attribute.name) &&
            attribute.name.name === "onClick"
          ) {
            return;
            if (attribute.value && isJSXExpressionContainer(attribute.value)) {
              const expression = attribute.value.expression;
              // console.log("i am concise body", expression);
              // Handle anonymous functions with concise body
              if (
                isArrowFunctionExpression(expression) &&
                !isBlockStatement(expression.body)
              ) {
                console.log("anonymous concise body", expression.body);
                const hit_stmt = next_fuzzer_stmt();
                expression.body = blockStatement([
                  hit_stmt,
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
                const hit_stmt = next_fuzzer_stmt();

                expression.body.body.unshift(hit_stmt);
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
