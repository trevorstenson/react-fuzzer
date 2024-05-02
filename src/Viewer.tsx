import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  addEdge,
  Node,
} from "reactflow";
import CustomEdge from "./CustomEdge";
import SelfConnecting from "./SelfConnectingEdge";
import { FuzzerOutput, ResultMap, StateMap } from "./fuzzer/types";
import "reactflow/dist/style.css";
import { HandlePosition } from "./ui_types";
import LabeledSmartEdge from "./LabeledSmartEdge";
import { SmartStepEdge } from "@tisoap/react-flow-smart-edge";

interface ClosestHandles {
  sourceHandle: HandlePosition;
  targetHandle: HandlePosition;
}

const findClosestHandles = (
  nodes: Node[],
  sourceNodeId: string,
  targetNodeId: string
): ClosestHandles | null => {
  const sourceNode = nodes.find((node) => node.id === sourceNodeId);
  const targetNode = nodes.find((node) => node.id === targetNodeId);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Basic logic for determining the closest handles
  // This example compares the X coordinates of the nodes
  // You can enhance this logic based on your layout and requirements
  let sourceHandle: HandlePosition;
  let targetHandle: HandlePosition;

  // Assuming handles are on all four sides of the nodes
  // if (sourceNode.position.x < targetNode.position.x) {
  //   sourceHandle = "r"; // right side of the source node
  //   targetHandle = "l"; // left side of the target node
  // } else {
  //   sourceHandle = "l"; // left side of the source node
  //   targetHandle = "r"; // right side of the target node
  // }

  const deltaX = Math.abs(sourceNode.position.x - targetNode.position.x);
  const deltaY = Math.abs(sourceNode.position.y - targetNode.position.y);

  if (deltaY > 200) {
    if (sourceNode.position.y < targetNode.position.y) {
      sourceHandle = "b";
      targetHandle = "t";
    } else {
      sourceHandle = "t";
      targetHandle = "b";
    }
  } else {
    if (sourceNode.position.x < targetNode.position.x) {
      sourceHandle = "r";
      targetHandle = "l";
    } else {
      sourceHandle = "l";
      targetHandle = "r";
    }
  }

  // if (deltaX > deltaY) {
  //   // Nodes are further apart horizontally, use left/right handles
  //   if (sourceNode.position.x < targetNode.position.x) {
  //     sourceHandle = 'r';
  //     targetHandle = 'l';
  //   } else {
  //     sourceHandle = 'l';
  //     targetHandle = 'r';
  //   }
  // } else {
  //   // Nodes are further apart vertically, use top/bottom handles
  //   if (sourceNode.position.y < targetNode.position.y) {
  //     sourceHandle = 'b';
  //     targetHandle = 't';
  //   } else {
  //     sourceHandle = 't';
  //     targetHandle = 'b';
  //   }
  // }

  // Add more logic here if you want to consider Y coordinates for 't' and 'b' handles

  return { sourceHandle, targetHandle };
};

function ResultNode({
  data,
}: {
  data: {
    label: string;
    img_data: string;
  };
}) {
  const img_data = data.img_data;
  return (
    <div className="max-w-[200px] relative">
      <Handle
        type="target"
        position={Position.Top}
        id="t"
        style={{ left: "30%", top: "20px", visibility: "hidden" }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="t"
        style={{ left: "70%", top: "20px", visibility: "hidden" }}
      />

      <Handle
        type="target"
        position={Position.Right}
        id="r"
        style={{ top: "30%", visibility: "hidden" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="r"
        style={{ top: "70%", visibility: "hidden" }}
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id="b"
        style={{ left: "70%", visibility: "hidden" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={{ left: "30%", visibility: "hidden" }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="l"
        style={{ top: "70%", visibility: "hidden" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="l"
        style={{ top: "30%", visibility: "hidden" }}
      />

      <div className="-mt-6">{data.label}</div>
      <div>
        <img src={img_data} />
      </div>
    </div>
  );
}

// generates a graphical representation of all states encountered during fuzzing
function Viewer({ fuzz_output }: { fuzz_output: FuzzerOutput | null }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const nodeTypes = useMemo(
    () => ({
      resultNode: ResultNode,
    }),
    []
  );
  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
      lsmart: LabeledSmartEdge,
      ssmart: SmartStepEdge,
      selfconnecting: SelfConnecting,
    }),
    []
  );

  useEffect(() => {
    if (!fuzz_output) return;
    const states_by_tick = [...fuzz_output.states.entries()].reduce(
      (acc, [key, value]) => {
        const tick = fuzz_output.state_ticks.get(key) ?? 0;
        if (!acc[tick]) {
          acc[tick] = [];
        }
        acc[tick].push(key);
        return acc;
      },
      {} as { [tick: number]: string[] }
    );
    console.log("state ticks", states_by_tick);
    const new_nodes = Object.entries(states_by_tick)
      .map(([tick, state_ids]) => {
        const result: any[] = [];
        state_ids.forEach((state_id, i) => {
          // const state_index = fuzz_output.states.get(state_id)!;
          const img_data = [...fuzz_output.result_map.entries()].find(
            ([key, value]) => value.hitmap === state_id
            //  && key.start_hitmap === state_id
          )?.[1].img_capture;
          // need to handle when theres multiple for a single state (start case)
          // const matching = [...fuzz_output.result_map.entries()].filter(
          //   ([key, value]) => value.hitmap === state_id
          //   // ([key, value]) => key.start_hitmap === value.hitmap && key.start_hitmap === state_id
          // );
          // console.log("matching", state_id, i, matching);
          // console.log('push!!!', state_id)
          result.push({
            id: state_id,
            type: "resultNode",
            data: { label: state_id || "Start", img_data: img_data },
            position: {
              // x: 500 * (parseInt(tick) ?? 0),
              // y: 300 * i + 25,
              y: 400 * (parseInt(tick) ?? 0),
              x: 300 * i + 25,
            },
            style: {
              color: "black",
            },
          });
        });
        return result;
      })
      .flat();
    // console.log("new nodes", new_nodes);
    setNodes(new_nodes);
    const edges = [...fuzz_output.result_map.entries()].map(([key, value]) => {
      const { sourceHandle, targetHandle } =
        findClosestHandles(new_nodes, key.start_hitmap, value.hitmap) ?? {};
      const edge: Edge = {
        // as string because reactflow doesn't like numbers
        id: Math.random() + "",
        source: key.start_hitmap,
        target: value.hitmap,
        label: key.description,
        data: {
          label: key.description,
          offset_x: (Math.random() * 2 - 1) * 40,
          offset_y: (Math.random() * 2 - 1) * 40,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: "#FF0072",
        },
        style: {
          strokeWidth: 3,
          stroke: "black",
        },
        type: key.start_hitmap === value.hitmap ? "ssmart" : "ssmart",
        sourceHandle,
        targetHandle,
      };
      return edge;
    });
    setEdges(edges);
    console.log("edges", edges);
  }, [fuzz_output, setEdges, setNodes]);

  if (!fuzz_output) return null;
  return (
    <div className="h-full w-full bg-gray-300">
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        edgesUpdatable={true}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default Viewer;
