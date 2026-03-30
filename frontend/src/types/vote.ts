export interface Vote {
  id: number;
  user_id: number;
  politician_id: number;
  type: 'approve' | 'disapprove';
}

export interface Rating {
  id: number;
  user_id: number;
  politician_id: number;
  attendance: number;
  project_quality: number;
  transparency: number;
  communication: number;
  average: number;
}
