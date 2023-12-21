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

function ResultNode({ data }: { data: any }) {
  // take data.img_data (data url) and render it
  const img_data = data.img_data;
  return (
    <div className="max-w-[200px]">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div>{data.label}</div>
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
  const edgeTypes = {
    selfconnecting: SelfConnecting,
    custom: CustomEdge,
  };

  // const fmap_entries = useMemo(() => {
  //   if (!fuzz_output) return [];
  //   return [...fuzz_output.result_map.entries()];
  // }, [fuzz_output]);

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
      console.log("state ticks", fuzz_output?.state_ticks, states_by_tick);
    const new_nodes = Object.entries(states_by_tick).map(
      ([tick, state_ids]) => {
        const result: any[] = [];
        state_ids.forEach((state_id, i) => {
          // const state_index = fuzz_output.states.get(state_id)!;
          const img_data = [...fuzz_output.result_map.entries()].find(
            ([key, value]) => key.start_hitmap === value.hitmap
          )?.[1].img_capture;
          result.push({
            id: state_id,
            type: "resultNode",
            data: { label: state_id || "Start", img_data: img_data },
            position: {
              x: 300 * (parseInt(tick) ?? 0),
              y: 200 * i + 25,
            },
            style: {
              color: "black",
            },
          });
        });
        return result;
      }
    );
    console.log("new nodes", new_nodes);
    // const nodes = [...fuzz_output.states.entries()].map(([key, value]) => {
    //   // find the img for this state:
    //   const img_data = [...fuzz_output.result_map.entries()].find(
    //     ([key, value]) => key.start_hitmap === value.hitmap
    //   )?.[1].img_capture;
    //   return {
    //     id: key,
    //     type: "resultNode",
    //     data: { label: key || "Start", img_data: img_data },
    //     position: {
    //       // x: 200 * value + 50,
    //       // make x more random
    //       x: 400 * Math.random() * value,
    //       y: 200 * Math.random() * value + 25,
    //       // // ensure nodes dont cover each other
    //       // x: 200 * value,
    //       // y: 200 * value + 25,
    //     },
    //     style: {
    //       color: "black",
    //     },
    //   };
    // });
    // console.log("hello", nodes);
    // console.log("fuzz", fuzz_output.result_map.entries());
    // setNodes(nodes);
    setNodes(new_nodes.flat());
    const edges = [...fuzz_output.result_map.entries()].map(([key, value]) => {
      let edge: Edge = {
        // as string because reactflow doesn't like numbers
        id: Math.random() + "",
        source: key.start_hitmap,
        target: value.hitmap,
        label: key.description,
        data: {
          label: key.description,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: "#FF0072",
        },
        style: {
          strokeWidth: 2,
          // stroke: '#FF0072',
        },
        type: "custom",
      };
      if (key.start_hitmap === value.hitmap) {
        edge = {
          ...edge,
          type: "selfconnecting",
        };
      }
      return edge;
    });
    setEdges(edges);
    console.log("edges", edges);
  }, [fuzz_output, setEdges, setNodes]);

  if (!fuzz_output) return null;
  return (
    <div className="h-[600px] w-full bg-gray-300">
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
