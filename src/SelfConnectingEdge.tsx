import React from "react";
import {
  BaseEdge,
  BezierEdge,
  EdgeProps,
  EdgeLabelRenderer,
  getBezierPath,
} from "reactflow";

export default function SelfConnecting(props: EdgeProps) {
  // we are using the default bezier edge when source and target ids are different
  if (props.source !== props.target) {
    return <BezierEdge {...props} />;
  }

  const [myPath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });

  const { sourceX, sourceY, targetX, targetY, id } = props;
  const radiusX = (sourceX - targetX) * 0.6;
  const radiusY = 50;
  const edgePath = `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 1 ${
    targetX + 2
  } ${targetY}`;
  const edgePathId = `edgepath-${id}`;
  const markerId = `arrow-${id}`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: "yellow", strokeWidth: 4 }} // Arrow body color changed to green
        markerEnd={`url(#${markerId})`} // Reference the arrow marker
      />
      <svg width="0" height="0">
        <defs>
          <path id={edgePathId} d={edgePath} fill="none" />
          {/* Arrow marker definition with red color */}
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
      <foreignObject width="100%" height="100%">
        <svg width="100%" height="100%">
          <text fill="red">
            <textPath href={`#${edgePathId}`} startOffset="50%" dy="-5" style={{ fontSize: "12px", fontWeight: "600",  }} textAnchor="middle">
              {props.data.label}
            </textPath>
          </text>
        </svg>
      </foreignObject>
      {/* <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${-100}px)`,
            background: "#ffcc00",
            padding: 10,
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 700,
          }}
          className="nodrag nopan"
        >
          Self Connecting2
        </div> */}
      {/* </EdgeLabelRenderer> */}
    </>
  );
}
