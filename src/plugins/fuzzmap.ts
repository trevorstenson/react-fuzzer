import template from "@babel/template";
import { NodePath, PluginObj, PluginPass } from "@babel/core";
import {
  isJSXAttribute,
  isJSXIdentifier,
  numericLiteral,
  JSXOpeningElement,
  isLogicalExpression,
  logicalExpression,
  sequenceExpression,
  jsxExpressionContainer,
} from "@babel/types";

const next_fuzzer_stmt = () => {
  return template.statement(
    `
      window.Fuzzer?.hit(HIT_ID);
    `
  )({
    HIT_ID: numericLiteral(curr_hit_id++),
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
        if (click_handler_stack.length > 0) {
          return;
        }
        const hit = next_fuzzer_stmt();
        if (hit instanceof Array) {
          hit.forEach((node) => {
            processed.add(node.start);
          });
        } else {
          processed.add(hit.start);
        }
        path.unshiftContainer("body", hit);
      },
      JSXExpressionContainer(path) {
        const expr = path.node.expression;
        if (!(isLogicalExpression(expr) && expr.operator === "&&")) return;
        if (processed.has(expr)) return;
        processed.add(expr);
        // convert: expr && <jsx>
        // to: expr && (window.Fuzzer && window.Fuzzer.hit(HIT_ID) && <jsx>)
        const hit_expr = template.expression(
          `window.Fuzzer?.hit(HIT_ID)`
        )({
          HIT_ID: numericLiteral(curr_hit_id++),
        });
        const new_expr = logicalExpression(
          "&&",
          expr.left,
          sequenceExpression([hit_expr, expr.right])
        );
        processed.add(new_expr);
        // replace the existing JSX expression container with the new logical expression
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
            BlockStatement(block_path) {
              processed.add(block_path.node.start);
            },
            exit() {
              click_handler_stack.pop();
            },
          });
        }
      },
    },
  };
};

export default fuzzmap_plugin;
