import React, { FC, useState } from "react";
import { EdgeProps, getBezierPath, BaseEdge } from "reactflow";
import { HandlePosition } from "./ui_types";
import { edge_list } from "./Viewer";
type Point = {
  x: number;
  y: number;
};

const calculateRightAnglePath = (
  source: Point,
  target: Point,
  sourceHandleType: HandlePosition,
  offset_x: number,
  offset_y: number
): string => {
  let path = "";
  if (sourceHandleType === "l" || sourceHandleType === "r") {
    const midX = (source.x + target.x) / 2 + offset_x;
    // Horizontal path segment first
    path = `M ${source.x},${source.y} L ${midX},${source.y} L ${midX},${target.y} L ${target.x},${target.y}`;
  } else {
    // HandleType is 'top' or 'bottom', want a random offset of 20px
    const midY = (source.y + target.y) / 2 + offset_y;
    // Vertical path segment first
    path = `M ${source.x},${source.y} L ${source.x},${midY} L ${target.x},${midY} L ${target.x},${target.y}`;
  }
  return path;
};

const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceHandleId = "l",
  data,
}) => {
  // const [edgePath] = getBezierPath({
  //   sourceX,
  //   sourceY,
  //   sourcePosition,
  //   targetX,
  //   targetY,
  //   targetPosition,
  // });
  const source: Point = { x: sourceX, y: sourceY };
  const target: Point = { x: targetX, y: targetY };
  const edgePath = calculateRightAnglePath(
    source,
    target,
    sourceHandleId as HandlePosition,
    data.offset_x,
    data.offset_y
  );

  const edgePathId = `edgepath-${id}`;
  const markerId = `arrow-${id}`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: "black", strokeWidth: 4 }} // Arrow body color changed to green
        markerEnd={`url(#${markerId})`} // Reference the arrow marker
      />
      <svg width="0" height="0">
        <defs>
          <path id={edgePathId} d={edgePath} fill="none" />
          <marker
            id={markerId}
            markerWidth="6" // Smaller width
            markerHeight="4" // Smaller height
            refX="6" // Adjusted based on the new size
            refY="2" // Center of the marker's height
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L6,2 z" fill="red" />{" "}
            {/* Adjusted path for the smaller size */}
          </marker>
        </defs>
      </svg>
      <foreignObject width="2000px" height="2000px">
        <svg width="100%" height="100%">
          <text fill="red">
            <textPath
              href={`#${edgePathId}`}
              startOffset="50%"
              dy="-5"
              style={{ fontSize: "12px", fontWeight: "600" }}
              textAnchor="middle"
            >
              {data.label}
            </textPath>
          </text>
        </svg>
      </foreignObject>
      {/* <foreignObject width="100" height="50" x={(sourceX + targetX) / 2 - 50} y={(sourceY + targetY) / 2 - 25}>
        <div xmlns="http://www.w3.org/1999/xhtml" className="edge-label">
          <div className="edge-icon">&#x1F5B1;</div>
          <div className="edge-text">{data.label}</div>
        </div>
      </foreignObject> */}
    </>
  );
};

export default CustomEdge;
