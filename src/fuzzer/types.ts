export type Hitmap = Map<number, number>;
export type HitmapHash = string;

export type FuzzAction = {
  id: number;
  elm: HTMLElement;
  type: "click" | "radio" | "input";
  options?: Record<string, any>;
};

export type SerializableFuzzAction = Omit<FuzzAction, "elm">;

export type RunPath = {
  start_hitmap: HitmapHash;
  action: SerializableFuzzAction;
}[];

export type FuzzerResultKey = {
  start_hitmap: HitmapHash;
  action_id: number;
  description: string;
};

export type FuzzerResultValue = {
  hitmap: HitmapHash;
  html: string;
  img_capture: string;
};


export type ResultMap = Map<FuzzerResultKey, FuzzerResultValue>;

export type FuzzerOutput = {
  result_map: ResultMap;
  states: StateMap;
  state_ticks: Map<string, number>;
};

export type AggregateFuzzResult = {
  run_paths: RunPath[];
  output: FuzzerOutput; // change this
}

export type StateId = number;

export type StateMap = Map<HitmapHash, StateId>;