import { HitmapHash, ResultMap, StateId, StateMap } from "./types";


export class Viewer {
  constructor() {}

  // generates a textual respresentation of the fuzzer's output for easy visualization.
  static generate_output_list(states: StateMap, result_map: ResultMap): HTMLElement[] {
    // for each state, figure out what actions taken from this state lead to new states.
    // also represent when you're at one state and an action leads to the same state. this is a loop.
    const result_list: HTMLElement[] = [];
    states.forEach((state_id: StateId, hitmap_hash: HitmapHash) => {
      const result_list_item = document.createElement("li");
      const state_id_text = document.createElement("p");
      state_id_text.innerText = `State ID: ${state_id}`;
      result_list_item.appendChild(state_id_text);
      const hitmap_hash_text = document.createElement("p");
      hitmap_hash_text.innerText = `Hitmap Hash: ${hitmap_hash}`;
      result_list_item.appendChild(hitmap_hash_text);

      const actions_list = document.createElement("ul");
      result_list_item.appendChild(actions_list);

      const actions = Array.from(result_map.keys()).filter(
        (key) => key.start_hitmap === hitmap_hash
      );
      actions.forEach((action) => {
        const action_item = document.createElement("li");
        const action_id_text = document.createElement("p");
        action_id_text.innerText = `Action ID: ${action.action_id}`;
        action_item.appendChild(action_id_text);
        const action_hitmap_text = document.createElement("p");
        action_hitmap_text.innerText = `Action Hitmap Hash: ${action.start_hitmap}`;
        action_item.appendChild(action_hitmap_text);
        const action_result = document.createElement("p");
        action_result.innerText = `Result: ${result_map.get(action)!.hitmap}`;
        action_item.appendChild(action_result);
        actions_list.appendChild(action_item);
      });

      result_list.push(result_list_item);
    });
    console.log('result list', result_list);
    return result_list;
  }
}