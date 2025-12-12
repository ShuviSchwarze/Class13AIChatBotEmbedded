export interface DocumentSource {
  text: string;
  source: string;
  page?: number;
  chunk_id?: string;
  distance?: number;
  score?: number;
}
