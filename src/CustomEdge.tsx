// // import React, { FC } from "react";
// // import { EdgeProps, getBezierPath, BaseEdge } from "reactflow";

// // const CustomEdge: FC<EdgeProps> = ({
// //   id,
// //   sourceX,
// //   sourceY,
// //   targetX,
// //   targetY,
// //   sourcePosition,
// //   targetPosition,
// //   data,
// // }) => {
// //   const [edgePath] = getBezierPath({
// //     sourceX,
// //     sourceY,
// //     sourcePosition,
// //     targetX,
// //     targetY,
// //     targetPosition,
// //   });

// //   const edgePathId = `edgepath-${id}`;

// //   return (
// //     <>
// //       <BaseEdge id={id} path={edgePath} />
// //       <svg width="0" height="0">
// //         <defs>
// //           <path id={edgePathId} d={edgePath} fill="none" />
// //         </defs>
// //       </svg>
// //       <foreignObject width="100%" height="100%">
// //         <svg width="100%" height="100%">
// //           <text fill="red">
// //             <textPath href={`#${edgePathId}`} startOffset="50%" dy="-5" style={{ fontSize: "16px", fontWeight: "700" }} textAnchor="middle">
// //               {data.label}
// //             </textPath>
// //           </text>
// //         </svg>
// //       </foreignObject>
// //     </>
// //   );
// // };

// // export default CustomEdge;


// import React, { FC } from "react";
// import { EdgeProps, getBezierPath, BaseEdge } from "reactflow";

// const CustomEdge: FC<EdgeProps> = ({
//   id,
//   sourceX,
//   sourceY,
//   targetX,
//   targetY,
//   sourcePosition,
//   targetPosition,
//   data,
// }) => {
//   const [edgePath] = getBezierPath({
//     sourceX,
//     sourceY,
//     sourcePosition,
//     targetX,
//     targetY,
//     targetPosition,
//   });

//   const edgePathId = `edgepath-${id}`;
//   const markerId = `arrow-${id}`;

//   return (
//     <>
//       <BaseEdge
//         id={id}
//         path={edgePath}
//         style={{ stroke: "#000", strokeWidth: 4 }} // Adjust stroke width here
//         markerEnd={`url(#${markerId})`} // Reference the arrow marker
//       />
//       <svg width="0" height="0">
//         <defs>
//           <path id={edgePathId} d={edgePath} fill="none" />
//           {/* Arrow marker definition */}
//           <marker
//             id={markerId}
//             markerWidth="10"
//             markerHeight="7"
//             refX="9" // Adjust this value based on arrow size
//             refY="3.5"
//             orient="auto"
//             markerUnits="strokeWidth"
//           >
//             <path d="M0,0 L0,7 L9,3.5 z" fill="#000" />
//           </marker>
//         </defs>
//       </svg>
//       <foreignObject width="100%" height="100%">
//         <svg width="100%" height="100%">
//           <text fill="red">
//             <textPath href={`#${edgePathId}`} startOffset="50%" dy="-5" style={{ fontSize: "16px", fontWeight: "700" }} textAnchor="middle">
//               {data.label}
//             </textPath>
//           </text>
//         </svg>
//       </foreignObject>
//     </>
//   );
// };

// export default CustomEdge;


import React, { FC } from "react";
import { EdgeProps, getBezierPath, BaseEdge } from "reactflow";

const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgePathId = `edgepath-${id}`;
  const markerId = `arrow-${id}`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: "green", strokeWidth: 4 }} // Arrow body color changed to green
        markerEnd={`url(#${markerId})`} // Reference the arrow marker
      />
      <svg width="0" height="0">
        <defs>
          <path id={edgePathId} d={edgePath} fill="none" />
          {/* Arrow marker definition with red color */}
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="7"
            refX="9" // Adjust this value based on arrow size
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,7 L9,3.5 z" fill="red" /> {/* Arrow head color changed to red */}
          </marker>
        </defs>
      </svg>
      <foreignObject width="100%" height="100%">
        <svg width="100%" height="100%">
          <text fill="red">
            <textPath href={`#${edgePathId}`} startOffset="50%" dy="-5" style={{ fontSize: "16px", fontWeight: "700" }} textAnchor="middle">
              {data.label}
            </textPath>
          </text>
        </svg>
      </foreignObject>
    </>
  );
};

export default CustomEdge;
