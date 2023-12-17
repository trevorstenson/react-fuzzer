import React, { useState } from "react";
import * as Babel from "@babel/standalone";
import { squareComponent } from "./test";
import fuzzmap_plugin from "./plugins/fuzzmap";

function App() {
  // const [code, setCode] = useState(`
  // function SimpleComponent() {
  //   const [message, setMessage] = React.useState("Hello, world!");
  //   const [color, setColor] = React.useState("red");

  //   const showGreenSquare = () => {
  //     console.log('xd green')
  //     setColor('green');
  //   }
  //   const showRedSquare = () => setColor('red');

  //   const handleClick = () => {
  //     setMessage("Button clicked!");
  //   };

  //   return (
  //     <div>
  //       <button data-fuzz-id="1" onClick={showGreenSquare}>Show Green Square</button>
  //       <button data-fuzz-id="2" onClick={() => setColor(null)}>Remove Square</button>
  //     <button data-fuzz-id="3" onClick={showRedSquare}>Show Red Square</button>
  //       <p>{message}</p>
  //       <button onClick={handleClick}>Click me</button>
  //       {color && (<div
  //         style={{
  //           width: '100px',
  //           height: '100px',
  //           backgroundColor: color,
  //           marginTop: '20px',
  //         }}
  //       />)}
  //     </div>
  //   );
  // }`);
  const [code, setCode] = useState(squareComponent);
  const [renderedComponent, setRenderedComponent] =
    useState<React.ReactElement | null>(null);
  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  };

  const runComponent = () => {
    window.Fuzzer?.set_root_element(document.getElementById("component-container")!);
    try {
      const transpiledCode = Babel.transform(code, {
        presets: ["react", "typescript"],
        plugins: [fuzzmap_plugin],
        filename: "test.tsx",
      }).code;
      // console.log('final code', transpiledCode)
      const Component = new Function("React", `return (${transpiledCode})`)(
        React
      );
      setRenderedComponent(<Component />);
    } catch (error) {
      console.error("Error transpiling or running the code:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full">
        <div className="flex flex-row w-full h-[500px]">
          <textarea
            className="w-1/2 bg-gray-500 text-white"
            value={code}
            onChange={handleCodeChange}
            placeholder="Paste your React component code here"
          />
          <div
            id="component-container"
            className="border-2 border-red w-1/2"
          >
            {renderedComponent}
          </div>
        </div>
        <button className="mt-4 w-1/3 p-2 bg-indigo-500" onClick={runComponent}>Run Component</button>
        {/* <div className="flex flex-row w-full">

        </div> */}
      </div>
    </>
  );
}

export default App;
