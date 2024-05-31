export const squareComponent = `function squareComponent() {
  const [color, setColor] = React.useState(null);
  const [showText, setShowText] = React.useState(false);

  const showGreenSquare = () => {
    // console.log('xd green');
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
      <button className="bg-red-500 px-4 py-2 m-2" data-fuzz-id="2" onClick={() => setColor(null)}>Remove Square</button>
      <button className="bg-red-500 px-4 py-2 m-2" data-fuzz-id="3" onClick={showRedSquare}>Show Red Square</button>
      </div>
      <label className="text-black">
        <input
          data-fuzz-id="4"
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

export const simpleLoginComponent = `
function simpleLoginComponent() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    console.log('what?', event.target.value)
    setPassword(event.target.value);
    setPasswordError('');
  };

  const validatePassword = () => {
    console.log('validating password', password)
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (!/\\d/.test(password)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validatePassword()) {
      console.log('LOGIN SUCCESSFUL')
      // Here you would typically handle the login logic
    }
  };

  return (
    <div className=" h-full w-full bg-white p-4">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <label className="text-black mb-2">
          Username:
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            data-fuzz-id="2"
            className="ml-2 border-2 border-gray-200"
          />
        </label>
        <label className="text-black mb-2">
          Password:
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className="ml-2 border-2 border-gray-200"
          />
        </label>
        {passwordError && (
          <div className="text-red-500 text-sm mb-2">{passwordError}</div>
        )}
        <button data-fuzz-id="1" type="submit" className="bg-blue-500 text-white px-4 py-2 mt-2">
          Login
        </button>
      </form>
    </div>
  );
}
`;

export const buttonEasyComponent = `
function buttonTravelComponent() {
  const [step, setStep] = React.useState("a");

  return (
    <div className="h-full w-full bg-white p04">
      {
        step === "a" && (
          <>
            <h1 className="text-black">Step A</h1>
            <button data-fuzz-id="1" onClick={() => setStep("b")} className="bg-blue-500 text-white px-4 py-2 mt-2">to B</button>
          </>
        )
      }
      {
        step === "b" && (
          <>
            <h1 className="text-black">Step B</h1>
            <button data-fuzz-id="2" onClick={() => setStep("a")} className="bg-blue-500 text-white px-4 py-2 mt-2">to A</button>
            <button data-fuzz-id="3" onClick={() => setStep("c")} className="bg-blue-500 text-white px-4 py-2 mt-2">to C</button>
          </>
        )
      }
      {
        step === "c" && (
          <>
            <h1 className="text-black">Step C</h1>
            <button data-fuzz-id="4" onClick={() => setStep("b")} className="bg-blue-500 text-white px-4 py-2 mt-2">to B!!! from C</button>
          </>
        )
      }
    </div>
  );
}
`;


export const buttonEasyComponentOld = `
function buttonTravelComponent() {
  const [step, setStep] = React.useState("a");

  return (
    <div className="h-full w-full bg-white p04">
      {
        step === "a" && (
          <>
            <h1 className="text-black">Step A</h1>
            <button data-fuzz-id="1" onClick={() => setStep("b")} className="bg-blue-500 text-white px-4 py-2 mt-2">to B</button>
          </>
        )
      }
      {
        step === "b" && (
          <>
            <h1 className="text-black">Step B</h1>
            <button data-fuzz-id="2" onClick={() => setStep("a")} className="bg-blue-500 text-white px-4 py-2 mt-2">to A</button>
            <button data-fuzz-id="3" onClick={() => setStep("c")} className="bg-blue-500 text-white px-4 py-2 mt-2">to C</button>
          </>
        )
      }
      {
        step === "c" && (
          <>
            <h1 className="text-black">Step C</h1>
            <button data-fuzz-id="4" onClick={() => setStep("c")} className="bg-blue-500 text-white px-4 py-2 mt-2">b3</button>
          </>
        )
      }
    </div>
  );
}
`;

export const buttonTravelComponent = `
function buttonTravelComponent() {
  const [step, setStep] = React.useState("a");

  return (
    <div className="h-full w-full bg-white p04">
      {
        step === "a" && (
          <>
            <h1 className="text-black">Step A</h1>
            <button data-fuzz-id="1" onClick={() => setStep("b")} className="bg-blue-500 text-white px-4 py-2 mt-2">b1</button>
            <button data-fuzz-id="2" onClick={() => setStep("b")} className="bg-blue-500 text-white px-4 py-2 mt-2">b2</button>
            <button data-fuzz-id="3" onClick={() => setStep("c")} className="bg-blue-500 text-white px-4 py-2 mt-2">b3</button>
          </>
        )
      }
      {
        step === "b" && (
          <>
            <h1 className="text-black">Step B</h1>
            <button data-fuzz-id="2" onClick={() => setStep("a")} className="bg-blue-500 text-white px-4 py-2 mt-2">b2</button>
            <button data-fuzz-id="3" onClick={() => setStep("c")} className="bg-blue-500 text-white px-4 py-2 mt-2">b3</button>
          </>
        )
      }
      {
        step === "c" && (
          <>
            <h1 className="text-black">Step C</h1>
            <button data-fuzz-id="1" onClick={() => setStep("a")} className="bg-blue-500 text-white px-4 py-2 mt-2">b1</button>
            <button data-fuzz-id="2" onClick={() => setStep("a")} className="bg-blue-500 text-white px-4 py-2 mt-2">b2</button>
            <button data-fuzz-id="3" onClick={() => setStep("b")} className="bg-blue-500 text-white px-4 py-2 mt-2">b3</button>
          </>
            )
      }
    </div>
  );
}
`;
