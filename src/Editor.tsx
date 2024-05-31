import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { andromeda } from "@uiw/codemirror-theme-andromeda";

function Editor({ initialCode, handleCodeChange }: any) {
  return (
    <CodeMirror
      height="45vh"
      value={initialCode}
      options={{
        lineNumbers: true,
      }}
      theme={andromeda}
      extensions={[javascript({ jsx: true })]}
      onChange={(value) => {
        handleCodeChange(value);
      }}
    />
  );
}

export default Editor;
