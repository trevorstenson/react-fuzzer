import html2canvas from "html2canvas";
import debounce from "lodash.debounce";
import { isEqual } from "lodash";
import {
  FuzzAction,
  FuzzerOutput,
  Hitmap,
  HitmapHash,
  ResultMap,
  StateMap,
} from "./types";
// import { Viewer } from "./viewer";

const FUZZ_INPUT = {
  // "button":
  // LETS O
};

export class Fuzzer {
  root_element: HTMLElement | null = null;

  running: boolean = false;
  last_hit_map: Hitmap = new Map();
  curr_hit_map: Hitmap = new Map();
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

  private initialize() {
    this.last_hit_map = this.curr_hit_map;
    this.initialized = true;
    this.ensure_state_exists(hash_hit_map(this.curr_hit_map));
  }

  set_root_element(elm: HTMLElement): void {
    this.root_element = elm;
  }

  private debounced_ready = debounce(() => {
    this.initialize();
  }, 100);

  hit(id: number): void {
    // if (!this.running) return;
    // console.log("history", id);
    if (this.curr_hit_map.has(id)) {
      this.curr_hit_map.set(id, this.curr_hit_map.get(id)! + 1);
    } else {
      this.curr_hit_map.set(id, 1);
    }
    if (!this.initialized) {
      this.debounced_ready();
    }
    // this.curr_hit_map.push(id);
  }

  async execute(): Promise<FuzzerOutput> {
    if (!this.root_element) {
      throw new Error("root element not set");
    }
    if (!this.initialized) {
      console.error("not initialized yet");
      this.initialize();
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
    console.log(
      "initial queue",
      this.queue.map((x) => {
        return {
          state: x.state,
          action: x.action.id,
        };
      })
    );
    while (this.queue.length > 0) {
      // find the first entry in queue that starts from my current state, remove it, and execute:
      const first_valid_input = this.queue.findIndex((curr_input) => {
        return isEqual(curr_input.state, hash_hit_map(this.curr_hit_map));
      });
      if (first_valid_input === -1) {
        console.error("no valid inputs");
        break;
      }
      const curr_input = this.queue.splice(first_valid_input, 1)[0];
      console.log("EXECUTE:", hash_hit_map(this.curr_hit_map), curr_input);
      await this.execute_action(curr_input.action);
      // add all new inputs to the queue:
      const inputs = this.prep_inputs();
      console.log(
        "cur queue",
        this.queue.map((x) => {
          return {
            state: x.state,
            action: x.action.id,
          };
        })
      );
      inputs.forEach((input) => {
        // ensure we don't add the same input twice:
        if (
          this.queue.some((i) => {
            return (
              i.action.id === input.id &&
              isEqual(i.state, hash_hit_map(this.curr_hit_map))
            );
          })
        ) {
          console.log("stop", this.queue, this.curr_hit_map);
          return;
        }
        // if its already in the result map, don't add it to the queue:
        if (
          [...this.result_map.keys()].some((key) => {
            return (
              key.action_id === input.id &&
              isEqual(key.start_hitmap, hash_hit_map(this.curr_hit_map))
              // maps_equal(key.start_hitmap, this.curr_hit_map)
            );
          })
        ) {
          console.log("stop 2", this.queue, hash_hit_map(this.curr_hit_map));
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
    }
    // this.finish();
    return {
      result_map: this.result_map,
      states: this.states,
      state_ticks: this.state_ticks,
    };
  }

  private async execute_action(action: FuzzAction): Promise<void> {
    const key = {
      // start_hitmap: hash_hit_map(this.last_hit_map),
      start_hitmap: hash_hit_map(this.last_hit_map),
      action_id: action.id,
      description: "",
    };
    this.last_hit_map = this.curr_hit_map;
    this.curr_hit_map.clear();
    if (action.type === "click") {
      action.elm.click(); // change to find elm here i imagine...
      key.description = `click ${action.id}: ${action.elm.innerText}`;
    }
    // TODO: better way to wait for 'static' page. (all relevant elements are loaded, etc.)
    await new Promise((resolve) => setTimeout(resolve, 500));
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
      this.state_ticks.set(hash_hit_map(this.curr_hit_map), source_state_tick + 1);
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
        id: i,
        elm: button,
        type: "click",
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
    this.queue = [];
    this.states.clear();
  }
}

// function hash_hit_map(hit_map: Map<number, number>): number {
//   const sorted_values = [...hit_map.values()].sort();
//   // Serialize and concatenate the sorted values
//   const concatenated = sorted_values
//     .map((value) => JSON.stringify(value))
//     .join("");
//   // Apply a simple hash function (you can replace this with a more robust hash function)
//   let hash = 0;
//   for (let i = 0; i < concatenated.length; i++) {
//     const char = concatenated.charCodeAt(i);
//     hash = (hash << 5) - hash + char;
//     hash |= 0; // Convert to 32bit integer
//   }
//   return hash;
// }

function hash_hit_map(hit_map: Hitmap): HitmapHash {
  // simple way to reliably hash the hitmap to allow for equality checks
  return [...hit_map.entries()].join(",");
}

function maps_equal(a: Hitmap, b: Hitmap): boolean {
  // if (a.size !== b.size) {
  //   return false;
  // }
  // for (const [key, value] of a) {
  //   if (b.get(key) !== value) {
  //     return false;
  //   }
  // }
  // return true;
  return isEqual([...a.entries()], [...b.entries()]);
}
