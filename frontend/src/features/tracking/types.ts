// null: the window has not started yet for this tester.
export type Returned = boolean | null;

export type AdoptionRow = {
  invitation_id: number;
  tester_first_name: string;
  profession: string;
  started_at: string;
  d1: Returned;
  d7: Returned;
  d30: Returned;
};

export type Adoption = {
  rows: AdoptionRow[];
  demo: boolean;
};
