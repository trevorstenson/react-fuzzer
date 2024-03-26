import React, { FC } from "react";
import { useNodes, BezierEdge, EdgeProps, BaseEdge } from "reactflow";
import { getSmartEdge, svgDrawStraightLinePath
 } from "@tisoap/react-flow-smart-edge";

const foreignObjectSize = 200;

const LabeledSmartEdge: FC<EdgeProps> = (props) => {
  const {
    id,
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerStart,
    markerEnd,
    data,
  } = props;

  const nodes = useNodes();

  const getSmartEdgeResponse = getSmartEdge({
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    nodes,
    options: {
      nodePadding: 20,
      // drawEdge: svgDrawStraightLinePath,
    }
  });

  // If the value returned is null, it means "getSmartEdge" was unable to find
  // a valid path, and you should do something else instead
  if (getSmartEdgeResponse === null) {
    return <BezierEdge {...props} />;
  }

  const edgePathId = `edgepath-${id}`;
  const markerId = `arrow-${id}`;
  const { edgeCenterX, edgeCenterY, svgPathString } = getSmartEdgeResponse;

  return (
    <>
      {/* <BaseEdge
        id={id}
        path={svgPathString}
        style={{ stroke: "black", strokeWidth: 4 }} // Arrow body color changed to green
        markerEnd={`url(#${markerId})`} // Reference the arrow marker
      /> */}
      {/* <path
				style={style}
				className='react-flow__edge-path'
				d={svgPathString}
				markerEnd={markerEnd}
				markerStart={markerStart}
			/> */}
      <svg width="0" height="0">
        <defs>
          <path id={edgePathId} d={svgPathString} fill="none" />
          <marker
            id={markerId}
            markerWidth="6" // Smaller width
            markerHeight="4" // Smaller height
            refX="6" // Adjusted based on the new size
            refY="2" // Center of the marker's height
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L6,2 z" fill="black" />{" "}
          </marker>
        </defs>
      </svg>
      <foreignObject width="2000px" height="2000px">
        <svg width="100%" height="100%">
          <text fill="black">
            <textPath
              href={`#${edgePathId}`}
              startOffset="50%"
              dy="-5"
              style={{ fontSize: "16px", fontWeight: "600", "background": "#fff" }}
              textAnchor="middle"
            >
              {data.label}
            </textPath>
          </text>
        </svg>
      </foreignObject>
      {/* <foreignObject
        width="2000px"
        height="2000px"
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <button
					onClick={(event) => {
						event.stopPropagation()
						alert(`remove ${id}`)
					}}
				>
					X
				</button>
      </foreignObject> */}
    </>
  );
};

export default LabeledSmartEdge;
