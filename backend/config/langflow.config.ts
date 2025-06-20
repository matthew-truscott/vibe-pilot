import 'dotenv/config';

interface CloudConfig {
  langflowId: string;
  apiKey?: string;
}

interface SelfHostedConfig {
  baseURL: string;
  apiKey?: string;
}

type ClientConfig = CloudConfig | SelfHostedConfig;

interface LangflowConfig {
  apiKey?: string;
  baseURL?: string;
  langflowId?: string;
  tourGuideFlowId: string;
  isCloudHosted: () => boolean;
  getClientConfig: () => ClientConfig;
}

const config: LangflowConfig = {
  apiKey: process.env.LANGFLOW_API_KEY,
  baseURL: process.env.LANGFLOW_BASE_URL,
  langflowId: process.env.LANGFLOW_ID,
  tourGuideFlowId: process.env.TOUR_GUIDE_FLOW_ID || '',
  
  // Determine if using cloud or self-hosted
  isCloudHosted: () => {
    return !!process.env.LANGFLOW_ID && !process.env.LANGFLOW_BASE_URL;
  },
  
  // Get the appropriate configuration
  getClientConfig: () => {
    if (config.isCloudHosted()) {
      return {
        langflowId: process.env.LANGFLOW_ID!,
        apiKey: process.env.LANGFLOW_API_KEY
      };
    } else {
      return {
        baseURL: process.env.LANGFLOW_BASE_URL || 'http://localhost:7860',
        apiKey: process.env.LANGFLOW_API_KEY
      };
    }
  }
};

export default config;