function App() {
  const [screen, setScreen] = React.useState("YourOrder");
  const [items, setItems] = React.useState(INITIAL_ITEMS);
  const [pickupLater, setPickupLater] = React.useState(false);
  const [pickupTime, setPickupTime] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [error, setError] = React.useState("");

  const { sortedItems, subtotal, total, alcohol } = React.useMemo(() => {
    const sortedItems = Array.from(items.entries()).sort((a, b) => a[0] - b[0]);
    const subtotal = sortedItems
      .map(([_code, item]) => item.quantity * item.price)
      .reduce((a, b) => a + b, 0);
    const total = subtotal + Math.round(subtotal * SALES_TAX);
    const alcohol =
      Array.from(items.values()).find((x) => x.alcohol) !== undefined;
    return { sortedItems, subtotal, total, alcohol };
  }, [items]);

  const onChangeQuantity = React.useCallback(
    (code) => (e) =>
      setItems((oldItems) => {
        const quantity = e.target.valueAsNumber;
        if (quantity !== quantity) return oldItems;
        const items = new Map(oldItems);
        if (quantity === 0) {
          items.delete(code);
        } else {
          const item = items.get(code);
          items.set(code, { ...item, quantity });
        }
        return items;
      }),
    []
  );

  const onClickContinue = React.useCallback(() => {
    setError("");
    setScreen("Checkout");
  }, []);

  const onClickPlaceOrder = React.useCallback(() => {
    if (pickupLater && pickupTime === "") {
      setError("Please select a pickup time.");
      return;
    }
    if (alcohol) {
      if (dateOfBirth === "") {
        setError("Please provide your date of birth.");
        return;
      }
      // Please don't use this.
      const dt = Date.now() - new Date(dateOfBirth).getTime();
      if (dt < 21 * 365.2425 * 86400 * 1000) {
        setError("You must be at least 21 to purchase alcohol.");
        return;
      }
    }
    setScreen("OrderConfirmed");
  }, [pickupLater, pickupTime, alcohol, dateOfBirth]);

  return (
    <div id="store">

      <h1>{STORE_NAME}</h1>

      {screen === "YourOrder" && (
        <>
          <h2>Your order</h2>

          <div className="screenContents">
            <table id="items">
              <tbody>
                {sortedItems.length === 0 ? (
                  <tr>
                    <td>You have no items selected.</td>
                  </tr>
                ) : (
                  sortedItems.map(([code, item]) => {
                    const { name, quantity, price } = item;
                    const id = `item-${code}`;
                    return (
                      <tr key={id}>
                        <td className="itemQuantity">
                          <input
                            type="number"
                            value={quantity}
                            onChange={onChangeQuantity(code)}
                            min={0}
                            max={9}
                            id={id}
                          />
                        </td>

                        <td className="itemName">
                          <label htmlFor={id}>{name}</label>
                        </td>

                        <td className="itemPrice">
                          <span>{showPrice(quantity * price)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <table id="total">
              <tbody>
                <tr>
                  <td>Subtotal</td>

                  <td>{showPrice(subtotal)}</td>
                </tr>

                <tr>
                  <td>Tax ({showPercentage(SALES_TAX)})</td>

                  <td>{showPrice(SALES_TAX * subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="progressButtons">
            <button
              id="nextButton"
              onClick={onClickContinue}
              disabled={sortedItems.length === 0}
            >
              Continue ({showPrice(total)})
            </button>
          </div>
        </>
      )}

      {screen === "Checkout" && (
        <>
          <h2>Checkout</h2>

          <div className="screenContents">
            <h3>Pickup time</h3>

            <ul id="pickupTimeOptions">
              <li>
                <input
                  type="radio"
                  name="pickupTime"
                  id="pickupASAP"
                  checked={!pickupLater}
                  onChange={() => setPickupLater(false)}
                />

                <label htmlFor="pickupASAP">As soon as possible</label>
              </li>

              <li>
                <input
                  type="radio"
                  name="pickupTime"
                  id="pickupLater"
                  checked={pickupLater}
                  onChange={() => setPickupLater(true)}
                />
                <label htmlFor="pickupLater">Later</label>{" "}
                <input
                  type="time"
                  aria-label="pickup time"
                  value={pickupTime}
                  onChange={(e) => {
                    setPickupLater(true);
                    setPickupTime(e.target.value);
                  }}
                />
              </li>
            </ul>

            {alcohol && (
              <>
                <h3>Alcohol</h3>
                What is your date of birth?{" "}
                <input
                  type="date"
                  aria-label="date of birth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </>
            )}
          </div>

          <div id="progressButtons">
            {error && <div id="checkoutError">{error}</div>}

            <a
              onClick={(e) => {
                e.preventDefault();
                setScreen("YourOrder");
              }}
              href="#"
              id="backButton"
            >
              Back
            </a>

            <button id="nextButton" onClick={onClickPlaceOrder}>
              Place order ({showPrice(total)})
            </button>
          </div>
        </>
      )}

      {screen === "OrderConfirmed" && (
        <>
          <h2>Order confirmed</h2>

          <div className="screenContents">
            <p>Your order is confirmed!</p>

            {!pickupLater ? (
              <p>{STORE_NAME} is preparing your order.</p>
            ) : (
              <>
                <p>{STORE_NAME} has received your order.</p>

                <p>It should be ready for pickup around {pickupTime}.</p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function showPrice(cents) {
  const iprice = Math.round(cents);
  return (
    "$" +
    Math.floor(iprice / 100) +
    "." +
    (iprice % 100).toString().padEnd(2, "0")
  );
}

function showPercentage(percentage) {
  return `${percentage * 100}%`;
}

const STORE_NAME = "Uncle Marty's Café";

const INITIAL_ITEMS = new Map();
INITIAL_ITEMS.set(1, { name: "Double-Shot Espresso", price: 425, quantity: 1 });
INITIAL_ITEMS.set(2, {
  name: "House Wine",
  price: 850,
  quantity: 2,
  alcohol: true,
});
INITIAL_ITEMS.set(3, {
  name: "Bacon, Egg & Cheddar Bagel",
  price: 825,
  quantity: 1,
});
INITIAL_ITEMS.set(4, { name: "Greek Salad", price: 950, quantity: 1 });

const SALES_TAX = 0.085;