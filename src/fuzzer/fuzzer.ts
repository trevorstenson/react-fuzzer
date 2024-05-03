import html2canvas from "html2canvas";
import debounce from "lodash.debounce";
import { isEqual } from "lodash";
import {
  AggregateFuzzResult,
  FuzzAction,
  FuzzerOutput,
  Hitmap,
  HitmapHash,
  ResultMap,
  RunPath,
  StateMap,
} from "./types";

// const FUZZ_INPUT = {
//   // "button":
//   // LETS O
// };

export class Fuzzer {
  root_element: HTMLElement | null = null;

  running: boolean = false;
  last_hit_map: Hitmap = new Map();
  curr_hit_map: Hitmap = new Map();
  curr_run_path: RunPath = [];
  finished_paths: RunPath[] = [];
  // not using yet:
  states: StateMap = new Map();
  // track in index to show what states were added when. ex: any state gotten to from the
  // initial state, will have an index of 1. any state reached from any of those states will have an index of 2.
  // if we reach a state that we've already seen, we can just use the index of that state.
  state_ticks: Map<string, number> = new Map();

  queue: {
    state: HitmapHash;
    action: FuzzAction;
  }[] = [];

  result_map: ResultMap = new Map();
  initialized: boolean = false;

  constructor() {}

  private async initialize() {
    // console.log("initializing");
    this.last_hit_map = this.curr_hit_map;
    this.initialized = true;
    if (!this.root_element) return;
    const initialHtml = this.root_element.innerHTML;
    const initialScreenshot = await html2canvas(this.root_element);
    const hitmapHash = hash_hit_map(this.curr_hit_map);
    console.log("base hash", hitmapHash);
    this.result_map.set(
      {
        start_hitmap: hitmapHash,
        action_id: -1, // -1 or another identifier for initial state
        description: "Initial State",
      },
      {
        hitmap: hitmapHash,
        html: initialHtml,
        img_capture: initialScreenshot.toDataURL(),
      }
    );
    // console.log('new ', {
    //   start_hitmap: hitmapHash,
    //   action_id: -1, // -1 or another identifier for initial state
    //   description: "Initial State",
    // },
    // {
    //   hitmap: hitmapHash,
    //   html: initialHtml,
    //   img_capture: initialScreenshot.toDataURL(),
    // })
    this.ensure_state_exists(hitmapHash);
  }

  set_root_element(elm: HTMLElement): void {
    this.root_element = elm;
  }

  private debounced_ready = debounce(() => {
    this.initialize();
  }, 100);

  hit(id: number, type?: string): void {
    // if (!this.initialized) return;
    // if (!this.running) return;
    console.trace("hit", id);
    if (type) {
      console.log('WITH:', type)
      // return;
    }
    if (this.curr_hit_map.has(id)) {
      this.curr_hit_map.set(id, this.curr_hit_map.get(id)! + 1);
    } else {
      this.curr_hit_map.set(id, 1);
    }
    if (!this.initialized) {
      this.debounced_ready();
    }
  }

  async run(
    n = 1,
    reset_cb: () => Promise<void>
  ): Promise<AggregateFuzzResult> {
    while (n > 0) {
      console.log("running", n);
      await reset_cb();
      await this.execute();
      n--;
    }
    return {
      run_paths: this.finished_paths, // TODO: might not need. go back to traveling version.
      output: {
        result_map: this.result_map,
        states: this.states,
        state_ticks: this.state_ticks,
      },
    };
  }

  async execute(startup: () => void): Promise<FuzzerOutput> {
    console.log('main execute called.')
    startup();
    // wait 1s
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (!this.root_element) {
      throw new Error("root element not set");
    }
    if (!this.initialized) {
      // console.error("not initialized yet");
      await this.initialize();
      // return;
    }
    const start_inputs = this.prep_inputs();
    console.log("start state", hash_hit_map(this.curr_hit_map));
    this.queue = start_inputs.map((input) => {
      return {
        state: hash_hit_map(this.curr_hit_map),
        action: input,
      };
    });
    // console.log("initial queue", structuredClone(this.queue));
    while (this.queue.length > 0) {
      console.log(
        "start queue",
        JSON.parse(
          JSON.stringify(this.queue, (k, v) => {
            if (k.includes("react")) {
              return undefined;
            }
            if (k === "elm") {
              return v.outerHTML;
            }
            return v;
          })
        )
      );
      // find the first entry in queue that starts from my current state, remove it, and execute:
      const first_valid_input = this.queue.findIndex((curr_input) => {
        return isEqual(curr_input.state, hash_hit_map(this.curr_hit_map));
      });
      if (first_valid_input === -1) {
        console.error("no valid inputs");
        console.log("WHATS LEFT", this.queue, hash_hit_map(this.curr_hit_map));
        // once hitting a dead end, push to finished paths and reset the state.
        this.finished_paths.push(this.curr_run_path);
        console.log("finished paths", this.finished_paths);
        // // TODO: implement traveling to different states when we hit a dead end.
        // // Need traveling to not count against fuzz results.
        // this.travel_to_first_valid();
        break;
      }
      const curr_input = this.queue.splice(first_valid_input, 1)[0];
      console.log("EXECUTE:", hash_hit_map(this.curr_hit_map), curr_input);
      await this.execute_action(curr_input.action);
      console.log(
        "done executing",
        curr_input.action,
        hash_hit_map(this.curr_hit_map)
      );
      // add all new inputs to the queue:
      const inputs = this.prep_inputs();
      // console.log("cur queue", structuredClone(this.queue));
      inputs.forEach((input) => {
        // ensure we don't add the same input twice:
        if (
          this.queue.some((i) => {
            return (
              i.action.id === input.id &&
              isEqual(i.state, hash_hit_map(this.curr_hit_map)) &&
              isEqual(i.action.options, input.options)
            );
          })
        ) {
          console.log(
            "dont add input twice",
            this.queue,
            hash_hit_map(this.curr_hit_map)
          );
          return;
        }
        // if its already in the result map, don't add it to the queue:
        if (
          [...this.result_map.keys()].some((key) => {
            return (
              key.action_id === input.id &&
              isEqual(key.start_hitmap, hash_hit_map(this.curr_hit_map))
            );
          })
        ) {
          // console.log(
          //   "unnecessary because in results already",
          //   this.queue,
          //   hash_hit_map(this.curr_hit_map)
          // );
          return;
        }
        console.log(
          "at state",
          hash_hit_map(this.curr_hit_map),
          "enqueue",
          input
        );
        this.queue.push({
          state: hash_hit_map(this.curr_hit_map),
          action: input,
        });
      });
      console.log(
        "end queue",
        JSON.parse(
          JSON.stringify(this.queue, (k, v) => {
            if (k.includes("react")) {
              return undefined;
            }
            if (k === "elm") {
              return v.outerHTML;
            }
            return v;
          })
        )
      );
      // debugger;
    }
    // this.finish();
    return {
      result_map: this.result_map,
      states: this.states,
      state_ticks: this.state_ticks,
    };
  }

  // builds the run path from the current state
  private build_run_path(): RunPath {
    // first push start state and initial action
    const run_path: RunPath = [];
    // iterate over state ticks in order to build the run path. first sort
    // the state ticks by their value (should go from 0 to n)
    // const sorted_state_ticks = [...this.state_ticks.entries()].sort(
    //   (a, b) => a[1] - b[1]
    // );
    // sorted_state_ticks.forEach(([state_hash, tick]) => {
    //   // find the action that led to this state
    //   const action = [...this.result_map.keys()].find((key) => {
    //     return key.start_hitmap === state_hash;
    //   });
    //   if (!action) {
    //     console.error("no action found for state", state_hash);
    //     return;
    //   }
    //   run_path.push({
    //     start_hitmap: state_hash,
    //     action: {
    //       id: action.action_id,
    //       type: action.description.split(" ")[0] as FuzzAction["type"],
    //       options: {
    //         value: action.description.split(" ").slice(-1)[0],
    //       },
    //     },
    //   });
    // });

    // console.log("run path", run_path);
    return run_path;
  }

  // This function is called when we are at a state that
  travel_to_first_valid() {
    // throw new Error("Method not implemented.");
  }

  private async execute_action(action: FuzzAction): Promise<void> {
    const key = {
      start_hitmap: hash_hit_map(this.last_hit_map),
      action_id: action.id,
      description: "",
    };
    this.last_hit_map = this.curr_hit_map;
    console.log(
      "clearing hit map while at state",
      hash_hit_map(this.curr_hit_map)
    );
    this.curr_hit_map.clear();
    if (action.type === "click") {
      const elm = document.querySelector(`[data-fuzz-id="${action.id}"]`);
      // console.log("raw click", action.elm.outerHTML, action.id);
      // debugger;
      if (!elm) {
        console.error("no element found for id", action.id);
        return;
      }
      (elm as HTMLElement).click();
      action.elm.click(); // change to find elm here i imagine...
      key.description = `click ${action.id}: ${action.elm.innerText}`;
    } else if (action.type === "radio") {
      (action.elm as HTMLInputElement).checked = !(
        action.elm as HTMLInputElement
      ).checked;
      key.description = `radio ${action.id}: ${action.elm.innerText} to ${
        (action.elm as HTMLInputElement).checked
      }`;
    } else if (action.type === "input") {
      const input_elm = action.elm as HTMLInputElement;
      const native_input_value_setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      console.log("we got?", native_input_value_setter);
      native_input_value_setter?.call(input_elm, action.options?.value);
      input_elm.dispatchEvent(new Event("input", { bubbles: true }));
      key.description = `input ${action.id}: ${action.elm.innerText} to ${action.options?.value}`;
    }
    this.curr_run_path.push({
      start_hitmap: key.start_hitmap,
      action: {
        id: action.id,
        type: action.type,
        options: action.options,
      },
    });
    // TODO: better way to wait for 'static' page. (all relevant elements are loaded, etc.)
    await new Promise((resolve) => setTimeout(resolve, 300));
    // debugger;
    const curr_html = this.root_element?.innerHTML || "";
    // create screenshot of the root elm and store it in the result_map
    const screenshot = await html2canvas(this.root_element!);
    this.result_map.set(key, {
      hitmap: hash_hit_map(this.curr_hit_map),
      html: curr_html,
      img_capture: screenshot.toDataURL(),
    });
    this.ensure_state_exists(hash_hit_map(this.curr_hit_map));
    if (!this.state_ticks.has(hash_hit_map(this.curr_hit_map))) {
      // state tick should be source state tick + 1
      const source_state_tick = this.state_ticks.get(key.start_hitmap) || 0;
      this.state_ticks.set(
        hash_hit_map(this.curr_hit_map),
        source_state_tick + 1
      );
    }
  }

  // create new identifier for the state if it doesn't exist yet
  private ensure_state_exists(state: HitmapHash): void {
    if (this.states.has(state)) return;
    this.states.set(state, this.states.size);
  }

  private prep_inputs(): FuzzAction[] {
    const buttons = document.querySelectorAll("button");
    // const inputs = document.querySelectorAll("input");
    const fuzz_actions: FuzzAction[] = [];
    buttons.forEach((button, i) => {
      const fuzz_id = button.getAttribute("data-fuzz-id");
      if (!fuzz_id) {
        return;
      }
      fuzz_actions.push({
        // TODO: ALL OF THIS IS PROBLEMATIC / IMPORTANT!!!
        // convert to number to ensure its a number
        id: parseInt(fuzz_id),
        // id: i,
        elm: button,
        type: "click",
      });
    });
    const text_inputs = document.querySelectorAll(
      "input[type=text], input[type=password]"
    );
    text_inputs.forEach((input, i) => {
      console.log("input", input);
      const fuzz_id = input.getAttribute("data-fuzz-id");
      if (!fuzz_id) return;
      // for inputs, its more involved. we want to try multiple
      // actions for each input. things like:
      // - a string of only alphanumerics
      // - a string of only special characters
      // - a string of only numbers
      // - a string of < 6 characters
      // - a string of > 20 characters
      [
        "1234567890",
        "test",
        "!@#$%^&*()",
        "a",
        Math.random().toString(36).substring(2, 22),
      ].forEach((value) => {
        fuzz_actions.push({
          id: i,
          elm: input as HTMLElement,
          type: "input",
          options: {
            value,
          },
        });
      });
    });

    const radios = document.querySelectorAll("input[type=radio]");
    radios.forEach((radio, i) => {
      const fuzz_id = radio.getAttribute("data-fuzz-id");
      if (!fuzz_id) {
        return;
      }
      fuzz_actions.push({
        id: i,
        elm: radio as HTMLElement,
        type: "radio",
      });
    });
    return fuzz_actions;
  }

  finish(): void {
    console.log("FINISH:", this.result_map.size, this.result_map);
    // insert element at the bottom of body with the results
    const containing_div = document.createElement("div");
    containing_div.style.position = "fixed";
    containing_div.style.bottom = "0";
    containing_div.style.left = "0";
    containing_div.style.width = "100%";
    containing_div.style.height = "50%";
    containing_div.style.backgroundColor = "black";
    containing_div.style.padding = "10px";
    containing_div.style.zIndex = "9999";
    containing_div.style.display = "flex";
    const image_elms = [...this.result_map.values()].map((result) => {
      const img = document.createElement("img");
      img.src = result.img_capture;
      // set width so that all image elms can fit left to right
      img.style.width = `${100 / this.result_map.size}%`;
      img.style.height = "100%";
      return img;
    });
    containing_div.innerHTML = image_elms.map((img) => img.outerHTML).join("");
    document.body.appendChild(containing_div);
    console.log("all found states:", this.states);
  }

  reset(): void {
    this.initialized = false;
    // this.running = false;
    // this.last_hit_map = this.curr_hit_map;
    this.curr_hit_map.clear();
    this.last_hit_map.clear();
    this.curr_run_path = [];
    this.queue = [];
    this.states.clear();
  }
}

function hash_hit_map(hit_map: Hitmap): HitmapHash {
  console.log('init', hit_map)
  const clamped = clamp_hit_map(hit_map);
  // console.log('HHHC', hit_map, clamped)
  // simple way to reliably hash the hitmap to allow for equality checks
  // return [...hit_map.entries()].join(",");
  return [...clamped.entries()].join(",");
}

function clamp_hit_map(hit_map: Hitmap): Hitmap {
  // clamp the hitmap values to 1
  const new_map = new Map();
  for (const key of hit_map.keys()) {
    new_map.set(key, 1);
  }
  return new_map;
}
