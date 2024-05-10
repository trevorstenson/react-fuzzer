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

const next_fuzzer_stmt = () => {
  return template.statement(
    `
    // if (typeof window !== 'undefined') {
      if (window.Fuzzer) {
        window.Fuzzer.hit(HIT_ID);
      }
      // }
    `
  )({
    HIT_ID: numericLiteral(curr_hit_id++),
  //  TYPE: stringLiteral(type || ''),
  });
};

let curr_hit_id = 0;
const processed = new Set();
const click_handler_stack: boolean[] = [];

const fuzzmap_plugin = (): PluginObj<PluginPass> => {
  return {
    name: "fuzzmap",
    visitor: {
      Function(path) {
        if (is_event_handler(path)) {
          return;
        }
        const hit_stmt = next_fuzzer_stmt();
        if (isBlockStatement(path.node.body)) {
          path.node.body.body.unshift(hit_stmt);
        } else {
          const body = blockStatement([hit_stmt, returnStatement(path.node.body)]);
          path.node.body = body;
        }
      },
      BlockStatement(path) {
        return;
        const node_id = path.node.start;
        if (processed.has(node_id)) {
          return;
        }
        if (click_handler_stack.length > 0) {
          return;
        }
        const hit = next_fuzzer_stmt();
        // if (click_handler_stack.length === 0) {
        //   // console.log("not in ch stack!!!!", path.toString());
        //   hit = next_fuzzer_stmt('load');
        // } else {
        //   hit = next_fuzzer_stmt();
        // }
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
        return;
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
        // if (path.node.name && isJSXIdentifier(path.node.name) && path.node.name.name !== 'input') {
        //   const hitStatement = next_fuzzer_stmt();
      
        //   // Find the closest parent function or block to insert the statement
        //   let currentPath = path;
        //   while (currentPath && !isBlockStatement(currentPath.node)) {
        //     currentPath = currentPath.parentPath;
        //   }
      
        //   if (currentPath && isBlockStatement(currentPath.node)) {
        //     // Insert the hit statement at the beginning of the block
        //     currentPath.node.body.unshift(hitStatement);
        //   } else {
        //     // If no block statement context is found, consider alternatives such as wrapping
        //     console.error("No valid insertion point found for the hit statement.");
        //   }
        // }
        // return;
        return;
        const on_click_attr = path.node.attributes.find(
          (attr) =>
            isJSXAttribute(attr) &&
            isJSXIdentifier(attr.name) &&
            attr.name.name === "onClick"
        );
        if (on_click_attr) {
          click_handler_stack.push(true);
          path.traverse({
            BlockStatement(block_path) {
              processed.add(block_path.node.start);
            },
            // JSXAttribute(attr_path) {
            //   if (attr_path.node === on_click_attr) {
            //     attr_path.stop();
            //   }
            // },
            exit() {
              click_handler_stack.pop();
            },
          });
        }
        // path.node.attributes.forEach((attribute) => {
        //   if (
        //     isJSXAttribute(attribute) &&
        //     isJSXIdentifier(attribute.name) &&
        //     attribute.name.name === "onClick"
        //   ) {
        //     return;
        //     if (attribute.value && isJSXExpressionContainer(attribute.value)) {
        //       const expression = attribute.value.expression;
        //       // console.log("i am concise body", expression);
        //       // Handle anonymous functions with concise body
        //       if (
        //         isArrowFunctionExpression(expression) &&
        //         !isBlockStatement(expression.body)
        //       ) {
        //         console.log("anonymous concise body", expression.body);
        //         const hit_stmt = next_fuzzer_stmt();
        //         expression.body = blockStatement([
        //           hit_stmt,
        //           returnStatement(expression.body),
        //         ]);
        //         expression.expression = false; // Convert from concise body to block body
        //       }
        //       // Handle anonymous functions (FunctionExpression or ArrowFunctionExpression) with block body
        //       else if (
        //         isFunctionExpression(expression) ||
        //         (isArrowFunctionExpression(expression) &&
        //           isBlockStatement(expression.body))
        //       ) {
        //         console.log("anonymous block body", expression);
        //         const hit_stmt = next_fuzzer_stmt();

        //         expression.body.body.unshift(hit_stmt);
        //       }

        //       // Handle named functions (Identifier)
        //       else if (isIdentifier(expression)) {
        //         console.log("named function", expression);
        //         const hitStatement = template.expression(`
        //           function() {
        //             // console.log('named function');
        //             if (typeof window !== 'undefined' && window.Fuzzer) {
        //               window.Fuzzer.hit(HIT_ID);
        //             }
        //             return ORIGINAL_IDENTIFIER();
        //           }
        //         `)({
        //           HIT_ID: numericLiteral(curr_hit_id++),
        //           ORIGINAL_IDENTIFIER: expression,
        //         });

        //         attribute.value.expression = hitStatement;
        //       }
        //     }
        //   }
        // });
      },
    },
  };
};

function is_event_handler(path: any) {
  // Simple heuristic to detect if a function is an event handler
  return path.node.key && path.node.key.name &&
         (path.node.key.name.startsWith('handle') || path.node.key.name.startsWith('on'));
}

export default fuzzmap_plugin;
