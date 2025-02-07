export const LLM_MODELS = {
  // Gemini Models
  GEMINI: {
    PRO: "gemini-pro",
    FLASH_2: "gemini-2.0-flash",
    FLASH_LITE: "gemini-2.0-flash-lite-preview-02-05"
  }
} as const;

// Type for all available models
export type LLMModel = typeof LLM_MODELS[keyof typeof LLM_MODELS][keyof typeof LLM_MODELS[keyof typeof LLM_MODELS]];

// Default models for different use cases
export const DEFAULT_MODELS = {
  TOPIC_GENERATION: LLM_MODELS.GEMINI.FLASH_LITE,
  TOPIC_COMBINATION: LLM_MODELS.GEMINI.FLASH_LITE
} as const; 