declare module 'langflow-chat' {
  export interface LangflowClientConfig {
    langflowId?: string;
    apiKey?: string;
    baseURL?: string;
  }

  export class LangflowClient {
    constructor(config: LangflowClientConfig);
    flow(flowId: string): {
      run(input: any): Promise<any>;
    };
  }
}