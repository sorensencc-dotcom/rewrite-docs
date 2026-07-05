export interface TorqueQueryPlan {
  collections: string[];
  filters?: any;
  limit?: number;
}

export class TorqueQueryPlanner {
  plan(query: any): TorqueQueryPlan {
    return {
      collections: [],
      limit: 100
    };
  }
}
