export interface ProcessingJob {
  id: string;
  toolId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: {
    downloadUrl: string;
    downloadFilename: string;
    message?: string;
  };
  error?: string;
}

export class ProcessingJobService {
  private static jobs: Map<string, ProcessingJob> = new Map();

  static createJob(toolId: string): string {
    const id = Math.random().toString(36).substring(2, 15);
    this.jobs.set(id, {
      id,
      toolId,
      status: 'pending',
      progress: 0
    });
    return id;
  }

  static updateJob(id: string, updates: Partial<ProcessingJob>) {
    const job = this.jobs.get(id);
    if (job) {
      this.jobs.set(id, { ...job, ...updates });
    }
  }

  static getJob(id: string): ProcessingJob | undefined {
    return this.jobs.get(id);
  }
}
