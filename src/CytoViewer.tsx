import React, { useEffect, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { FuzzerOutput } from "./fuzzer/types";

function Viewer({ fuzz_output }: { fuzz_output: FuzzerOutput | null }) {
  const cyRef = React.useRef<any>(null);
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    if (cyRef.current) {
      // Add event listener for node dragging
      cyRef.current.on('dragfree', 'node', () => {
        cyRef.current.fit();
      });
    }

    return () => {
      // Cleanup listener when component unmounts or Cytoscape instance changes
      if (cyRef.current) {
        cyRef.current.removeListener('dragfree', 'node');
      }
    };
  }, []);

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
    const nodes_formatted = Object.entries(states_by_tick)
      .map(([tick, state_ids]) => {
        const result: any[] = [];
        state_ids.forEach((state_id, i) => {
          // const state_index = fuzz_output.states.get(state_id)!;
          const img_data = [...fuzz_output.result_map.entries()].find(
            ([key, value]) => key.start_hitmap === value.hitmap
          )?.[1].img_capture;
          result.push(
            {
              data: {
                id: `node-${state_id}`,
                label: state_id || "Start",
                img: img_data,
                width: 400,
                height: 250,
                "font-size": "25",
              },
              // position: {
              //   x: 200 * i + 25,
              //   y: 400 * (parseInt(tick) ?? 0),
              // },
            }
          );
        });
        return result;
      })
      .flat();

    // const nodes = [...fuzz_output.states.entries()].map(([key, value]) => {
    //   const img_data = [...fuzz_output.result_map.entries()].find(
    //     ([key, value]) => key.start_hitmap === value.hitmap
    //   )?.[1].img_capture;
    //   // const img_data = value.img_capture;
    //   const nodeWidth = 300; // Adjust based on your content
    //   const nodeHeight = 150; // Adjust based on your content

    //   return {
    //     data: {
    //       id: `node-${key}`,
    //       label: key || "Start",
    //       img: img_data,
    //       width: nodeWidth,
    //       height: nodeHeight,
    //     },
    //     position: {
    //       x: 400 * Math.random() * value,
    //       y: 300 * Math.random() * value + 25,
    //       // x: 200 * value,
    //       // y: 150 * value + 25,
    //     },
    //   };
    // });

    const edges = [...fuzz_output.result_map.entries()].map(
      ([key, value], index) => {
        return {
          data: {
            id: `edge-${index}`,
            source: `node-${key.start_hitmap}`,
            target: `node-${value.hitmap}`,
            label: key.description,
          },
        };
      }
    );
    console.log('NODES', nodes_formatted)
    console.log('edges', edges)
    setElements([...nodes_formatted, ...edges]);
  }, [fuzz_output]);

  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      const layout = cyRef.current.layout({
        name: 'cose',
        idealEdgeLength: 200,
        nodeOverlap: 20,
        fit: true,
        avoidOverlap: true,
      });
      layout.run();
    }
  }, [elements]); // Run this effect whenever 'elements' changes
  

  const style = [
    {
      selector: "node",
      style: {
        shape: "rectangle",
        width: "data(width)",
        height: "data(height)",
        "background-color": "#666",
        "background-image": "data(img)",
        "background-fit": "cover",
        label: "data(label)",
        "text-valign": "top",
        "text-halign": "left",
        // "font-size": "20",
      },
    },
    {
      selector: "edge",
      // style: {
      //   'width': 3,
      //   'line-color': '#ccc',
      //   'target-arrow-color': '#ccc',
      //   'target-arrow-shape': 'triangle',
      //   'curve-style': 'bezier',
      //   'label': 'data(label)',
      //   'text-rotation': 'autorotate'
      // }
      style: {
        width: 2,
        "line-color": "green",
        "target-arrow-color": "red",
        "arrow-scale": 2, // Make arrowheads larger
        "target-arrow-shape": "triangle", // Add arrowheads
        "curve-style": "bezier",
        label: "data(label)",
        "text-rotation": "autorotate",
        "text-margin-y": -10, // Adjust label margin if needed
      },
    },
  ];

  const layout = {
    name: "cose",
    idealEdgeLength: 200,
    // nodeOverlap: 20,
    fit: true,
    // refresh: 20,
    // avoidOverlap: true,
  };
  // const layout = { name: 'grid', rows: 10, cols: 10, fit: true, avoidOverlap: true }
  return (
    <div className="h-full w-full bg-gray-300">
      <CytoscapeComponent
        cy={(cy) => {
          cyRef.current = cy;
        }}
        elements={CytoscapeComponent.normalizeElements(elements)}
        style={{ width: "100%", height: "100%" }}
        layout={layout}
        stylesheet={style}
        zoomingEnabled={true}
        userZoomingEnabled={true}
        panningEnabled={true}
        userPanningEnabled={true}
        draggable={true}
      />
    </div>
  );
}

export default Viewer;
