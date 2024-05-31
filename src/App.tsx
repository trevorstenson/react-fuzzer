import React, { useState } from "react";
import * as Babel from "@babel/standalone";
import {
  buttonEasyComponent,
} from "./test";
import fuzzmap_plugin from "./plugins/fuzzmap";
import Viewer from "./Viewer";
import { FuzzerOutput } from "./fuzzer/types";
import Editor from "./Editor";

function App() {
  const [code, setCode] = useState(buttonEasyComponent);
  const [renderedComponent, setRenderedComponent] =
    useState<React.ReactElement | null>(null);
  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  };

  const [fuzzOutput, setFuzzOutput] = useState<FuzzerOutput | null>(null);

  const runComponent = async () => {
    if (!window.Fuzzer) {
      console.error("Fuzzer not loaded.");
      return;
    }
    window.Fuzzer.set_root_element(
      document.getElementById("component-container")!
    );
    const Component = await loadComponent(true);
    if (!Component) return;
    const results = await window.Fuzzer.execute(async () => {
      setRenderedComponent(<Component />);
    });
    setFuzzOutput(results);
  };

  const loadComponent = async (
    fuzz: boolean
  ): Promise<React.ComponentType | null> => {
    try {
      const transpiledCode = Babel.transform(code, {
        presets: ["react", "typescript"],
        plugins: fuzz ? [fuzzmap_plugin] : [],
        filename: "test.tsx",
      }).code;
      const Component = new Function("React", `return (${transpiledCode})`)(
        React
      );
      // wait for the component to render before fuzzing
      setRenderedComponent(<Component />);
      return Component;
    } catch (error) {
      console.error("Error transpiling or running the code:", error);
    }
    return null;
  };

  return (
    <div className="flex flex-row w-full h-screen">
      <div className="flex flex-col w-2/5 h-full">
        <div className="w-full bg-dark">
          <Editor initialCode={code} onChange={handleCodeChange} />
        </div>
        <div className="flex flex-row my-auto justify-around items-center w-full bg-dark">
          <button
            className="w-1/3 p-2 my-auto bg-indigo-500 rounded-lg"
            onClick={() => loadComponent(false)}
          >
            Load Component
          </button>
          <button
            className="w-1/3 p-2 my-auto bg-indigo-500 rounded-lg"
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
