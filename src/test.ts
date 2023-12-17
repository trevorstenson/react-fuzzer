export const squareComponent = `
function squareComponent() {
  const [color, setColor] = React.useState(null);

  const showGreenSquare = () => {
    console.log('xd green');
    setColor('green');
  }
    const showRedSquare = () => setColor('red');

  return (
    <div>
      <button data-fuzz-id="1" onClick={showGreenSquare}>Show Green Square</button>
      <button data-fuzz-id="2" onClick={() => setColor(null)}>Remove Square</button>
      <button data-fuzz-id="3" onClick={showRedSquare}>Show Red Square</button>

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
}
`;
