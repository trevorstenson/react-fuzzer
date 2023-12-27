export const squareComponent = `function squareComponent() {
  const [color, setColor] = React.useState(null);
  const [showText, setShowText] = React.useState(false);

  const showGreenSquare = () => {
    console.log('xd green');
    setColor('green');
  }
  const showRedSquare = () => setColor('red');

  const handleCheckedRadio = () => {
    setShowText(!showText)
  }


  return (
    <div className=" h-full w-full bg-white">
      <div className="flex flex-row">
      <button className="bg-red-500 px-4 py-2 m-2" data-fuzz-id="1" onClick={showGreenSquare}>Show Green Square</button>
      <button className="bg-red-500 px-4 py-2 m-2"data-fuzz-id="2" onClick={() => setColor(null)}>Remove Square</button>
      <button className="bg-red-500 px-4 py-2 m-2" data-fuzz-id="3" onClick={showRedSquare}>Show Red Square</button>
      </div>
      <label className="text-black">
        <input
          type="radio"
          name="show_text"
          onChange={handleCheckedRadio}
        />
          Show Text
      </label>

      {showText && (
        <div className="text-2xl text-black">
          Radio is checked
        </div>
      )}

      {color && (
        <div
          style={{
            width: '100px',
            height: '100px',
            backgroundColor: color,
            marginTop: '20px',
          }}
        />
      )}
    </div>
  );
}`;
