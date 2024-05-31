import html2canvas from "html2canvas";
import debounce from "lodash.debounce";
import { isEqual } from "lodash";
import {
  FuzzAction,
  FuzzerOutput,
  Hitmap,
  HitmapHash,
  ResultMap,
  RunPath,
  StateMap,
} from "./types";

export class Fuzzer {
  root_element: HTMLElement | null = null;

  running: boolean = false;
  traveling: boolean = false;
  last_hit_map: Hitmap = new Map();
  curr_hit_map: Hitmap = new Map();
  curr_run_path: RunPath = [];
  finished_paths: RunPath[] = [];
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

  private async initialize() {
    this.last_hit_map = this.curr_hit_map;
    this.initialized = true;
    if (!this.root_element) return;
    const initial_html = this.root_element.innerHTML;
    const screenshot = await html2canvas(this.root_element);
    const hitmap_hash = hash_hit_map(this.curr_hit_map);
    this.result_map.set(
      {
        start_hitmap: hitmap_hash,
        action_id: -1, // -1 or another identifier for initial state
        description: "Initial State",
      },
      {
        hitmap: hitmap_hash,
        html: initial_html,
        img_capture: screenshot.toDataURL(),
      }
    );
    this.ensure_state_exists(hitmap_hash);
  }

  set_root_element(elm: HTMLElement): void {
    this.root_element = elm;
  }

  private debounced_ready = debounce(() => {
    this.initialize();
  }, 100);

  hit(id: number): void {
    // if (this.traveling) return;
    // if (!this.initialized) return;
    // console.log("hit", id);
    if (this.curr_hit_map.has(id)) {
      this.curr_hit_map.set(id, this.curr_hit_map.get(id)! + 1);
    } else {
      this.curr_hit_map.set(id, 1);
    }
    if (!this.initialized) {
      this.debounced_ready();
    }
  }

  async execute(startup: () => Promise<void>): Promise<FuzzerOutput> {
    await startup();
    // wait 2s
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (!this.root_element) {
      throw new Error("root element not set");
    }
    if (!this.initialized) {
      await this.initialize();
    }
    const start_inputs = this.prep_inputs();
    this.queue = start_inputs.map((input) => {
      return {
        state: hash_hit_map(this.curr_hit_map),
        action: input,
      };
    });
    while (this.queue.length > 0) {
      // find the first entry in queue that starts from my current state, remove it, and execute:
      let first_valid_input = this.queue.findIndex((curr_input) => {
        return isEqual(curr_input.state, hash_hit_map(this.curr_hit_map));
      });
      if (first_valid_input === -1) {
        console.warn("no valid inputs, travel");
        // once hitting a dead end, push to finished paths and reset the state.
        this.finished_paths.push(this.curr_run_path);
        await this.travel_to_first_valid();
        first_valid_input = this.queue.findIndex((curr_input) => {
          return isEqual(curr_input.state, hash_hit_map(this.curr_hit_map));
        });
        if (first_valid_input === -1) {
          console.error("no valid inputs found");
          break;
        }
      }
      const curr_input = this.queue.splice(first_valid_input, 1)[0];
      await this.execute_action(curr_input.action);
      // add all new inputs to the queue:
      const inputs = this.prep_inputs();
      inputs.forEach((input) => {
        // ensure we don't add the same input twice:
        if (
          this.queue.some((i) => {
            return (
              i.action.elm_id === input.elm_id &&
              isEqual(i.state, hash_hit_map(this.curr_hit_map)) &&
              isEqual(i.action.options, input.options)
            );
          })
        ) {
          return;
        }
        // if its already in the result map, don't add it to the queue:
        if (
          [...this.result_map.keys()].some((key) => {
            return (
              key.action_id === input.elm_id &&
              isEqual(key.start_hitmap, hash_hit_map(this.curr_hit_map))
            );
          })
        ) {
          return;
        }
        this.queue.push({
          state: hash_hit_map(this.curr_hit_map),
          action: input,
        });
      });
    }
    return {
      result_map: this.result_map,
      states: this.states,
      state_ticks: this.state_ticks,
    };
  }

  // This function is called when we are at a state that has no more valid inputs.
  // We need to find a state that has valid remaining inputs and "travel" to that state.
  async travel_to_first_valid(): Promise<void> {
    this.traveling = true;
    // get first in queue that has a valid state (peek)
    const first = this.queue[0];
    const target_state = first.state;
    // find the path to get to that state
    const path = this.find_path_between_states(
      hash_hit_map(this.curr_hit_map),
      target_state
    );
    // execute the path
    for (const step of path) {
      await this.execute_action(step.action);
    }
    this.traveling = false;
  }

  private find_path_between_states(
    start: HitmapHash,
    end: HitmapHash
  ): RunPath {
    // use run path information to find a path between two states
    // find index of end state in run_path
    const end_index =
      this.curr_run_path.findIndex((path) => path.start_hitmap === end) + 1;
    // find index of start state in run_path
    const start_index = this.curr_run_path.findIndex(
      (path) => path.start_hitmap === start
    );
    // find the path between the two states
    const path = this.curr_run_path.slice(start_index, end_index - 1);
    return path;
  }

  private async execute_action(
    action: FuzzAction,
    start_map?: HitmapHash
  ): Promise<void> {
    const key = {
      start_hitmap: start_map ?? hash_hit_map(this.last_hit_map),
      action_id: action.elm_id,
      description: "",
    };
    const elm = document.querySelector(
      `[data-fuzz-id="${action.elm_id}"]`
    ) as HTMLElement;
    if (!elm) {
      return;
    }
    this.last_hit_map = start_map
      ? unhash_hit_map(start_map)
      : this.curr_hit_map;
    this.curr_hit_map.clear();
    if (action.type === "click") {
      elm.click();
      key.description = `click ${action.elm_id}: ${elm.innerText}`;
    } else if (action.type === "radio") {
      (elm as HTMLInputElement).checked = !(elm as HTMLInputElement).checked;
      const event = new Event("change", { bubbles: true });
      const prop_name = "onChange";
      const react_propname = Object.keys(elm).find((key) =>
        key.startsWith("__reactProps$")
      );
      if (react_propname) {
        const react_events = (elm as any)[react_propname];
        if (react_events && react_events[prop_name]) {
          react_events[prop_name](event);
        }
      } else {
        elm.dispatchEvent(event);
      }
      key.description = `radio ${action.elm_id}: ${elm.innerText} to ${
        (elm as HTMLInputElement).checked
      }`;
    } else if (action.type === "input") {
      const input_elm = document.querySelector(
        `[data-fuzz-id="${action.elm_id}"]`
      ) as HTMLInputElement;
      const native_input_value_setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      native_input_value_setter?.call(input_elm, action.options?.value);
      input_elm.dispatchEvent(new Event("input", { bubbles: true }));
      key.description = `input ${action.elm_id}: ${elm.innerText} to ${action.options?.value}`;
    }
    if (!this.traveling) {
      this.curr_run_path.push({
        start_hitmap: key.start_hitmap,
        action: {
          elm_id: action.elm_id,
          type: action.type,
          options: action.options,
        },
      });
    }
    // TODO: better way to wait for 'static' page. (all relevant elements are loaded, etc.)
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!this.traveling) {
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
  }

  // create new identifier for the state if it doesn't exist yet
  private ensure_state_exists(state: HitmapHash): void {
    if (this.states.has(state)) return;
    this.states.set(state, this.states.size);
  }

  private prep_inputs(): FuzzAction[] {
    const buttons = document.querySelectorAll("button");
    const fuzz_actions: FuzzAction[] = [];
    buttons.forEach((button) => {
      const fuzz_id = button.getAttribute("data-fuzz-id");
      if (!fuzz_id) return;
      fuzz_actions.push({
        elm_id: parseInt(fuzz_id),
        type: "click",
      });
    });
    const text_inputs = document.querySelectorAll(
      "input[type=text], input[type=password]"
    );
    text_inputs.forEach((input) => {
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
          elm_id: parseInt(fuzz_id),
          type: "input",
          options: {
            value,
          },
        });
      });
    });

    const radios = document.querySelectorAll("input[type=radio]");
    radios.forEach((radio) => {
      const fuzz_id = radio.getAttribute("data-fuzz-id");
      if (!fuzz_id) return;
      fuzz_actions.push({
        elm_id: parseInt(fuzz_id),
        type: "radio",
      });
    });
    return fuzz_actions;
  }

  finish(): void {
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
  }

  reset(): void {
    this.initialized = false;
    // this.running = false;
    this.curr_hit_map.clear();
    this.last_hit_map.clear();
    this.curr_run_path = [];
    this.queue = [];
    this.states.clear();
  }
}

// hitmap to string hash for easy comparison
function hash_hit_map(hit_map: Hitmap, clamp = true): HitmapHash {
  if (clamp) {
    hit_map = clamp_hit_map(hit_map);
  }
  return [...hit_map.entries()].join(",");
}

function unhash_hit_map(hash: HitmapHash): Hitmap {
  const map = new Map();
  // "0,1,3,1,2,2,7,4" becomes {0: 1, 3: 1, 2: 2, 7: 4}
  hash.split(",").forEach((val, i) => {
    if (i % 2 === 0) {
      map.set(parseInt(val), parseInt(hash.split(",")[i + 1]));
    }
  });
  return map;
}

// Clamping hits to 1 for generalizing things like multiple clicks or loops
function clamp_hit_map(hit_map: Hitmap): Hitmap {
  const new_map = new Map();
  for (const key of hit_map.keys()) {
    new_map.set(key, 1);
  }
  return new_map;
}
