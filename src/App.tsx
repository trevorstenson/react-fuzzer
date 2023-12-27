import React, { useState } from "react";
import * as Babel from "@babel/standalone";
import { squareComponent } from "./test";
import fuzzmap_plugin from "./plugins/fuzzmap";
import Viewer from "./Viewer";
import { FuzzerOutput, ResultMap } from "./fuzzer/types";
import CytoViewer from "./CytoViewer";

function App() {
  const [code, setCode] = useState(squareComponent);
  const [renderedComponent, setRenderedComponent] =
    useState<React.ReactElement | null>(null);
  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  };

  const [fuzzOutput, setFuzzOutput] = useState<FuzzerOutput | null>(null);

  const runComponent = async () => {
    window.Fuzzer?.set_root_element(
      document.getElementById("component-container")!
    );
    try {
      const transpiledCode = Babel.transform(code, {
        presets: ["react", "typescript"],
        plugins: [fuzzmap_plugin],
        filename: "test.tsx",
      }).code;
      console.log("final code", transpiledCode);
      const Component = new Function("React", `return (${transpiledCode})`)(
        React
      );
      console.log("my component", Component);
      setRenderedComponent(<Component />);
      // wait for the component to render before fuzzing
      await new Promise((resolve) => setTimeout(resolve, 500));
      const results = await window.Fuzzer?.execute();
      console.log("wwww", results);
      setFuzzOutput(results);
    } catch (error) {
      console.error("Error transpiling or running the code:", error);
    }
  };

  // return (
  //   <>
  //     <div className="flex flex-col w-full">
  //       <div className="flex flex-row w-full h-[400px]">
  //         <textarea
  //           spellCheck={false}
  //           className="w-1/2 bg-gray-100 text-black"
  //           value={code}
  //           onChange={handleCodeChange}
  //           placeholder="Paste your React component code here"
  //         />
  //         <div
  //           id="component-container"
  //           className="border-2 border-red w-1/2"
  //         >
  //           {renderedComponent}
  //         </div>
  //       </div>
  //       <button className="mt-4 w-1/3 p-2 bg-indigo-500" onClick={runComponent}>Run Component</button>
  //       <Viewer fuzz_output={fuzzOutput} />
  //       {/* <CytoViewer fuzz_output={fuzzOutput} /> */}
  //     </div>
  //   </>
  // );

  return (
    <div className="flex flex-row w-full h-screen">
      <div className="flex flex-col w-2/5 h-full">
        <textarea
          spellCheck={false}
          className="w-full h-1/2 bg-gray-200 text-black"
          value={code}
          onChange={handleCodeChange}
          placeholder="Paste your React component code here"
        />
        <div className="flex flex-row -mt-10 w-full justify-end">
          <button
            className="w-1/3 p-2 mr-4 bg-indigo-500 rounded-lg"
            onClick={runComponent}
          >
            Run Component
          </button>
        </div>
        <div
          id="component-container"
          className="border-2 border-red bg-white w-full h-1/2"
        >
          {renderedComponent}
        </div>
      </div>
      <div className="flex flex-col w-3/5 h-full">
        <Viewer fuzz_output={fuzzOutput} />
        {/* <CytoViewer fuzz_output={fuzzOutput} /> */}
      </div>
    </div>
  );
}

export default App;
