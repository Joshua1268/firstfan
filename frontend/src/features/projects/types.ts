export type ProjectSummary = {
  id: number;
  name: string;
  url: string;
  created_at: string;
};

export type ProjectDetail = {
  id: number;
  name: string;
  url: string;
  description: string;
  fingerprint: string;
  fingerprinted_at: string;
  public_key: string;
  script_snippet: string;
  script_seen_at: string | null;
  captures: { sha256: string }[];
};
