import { Score, Settings } from "../types";

const SCORES_KEY = "vibe-pilot-scores";
const SETTINGS_KEY = "vibe-pilot-settings";

export const getScores = (): Score[] => {
  const scores = localStorage.getItem(SCORES_KEY);
  return scores ? JSON.parse(scores) : [];
};

export const addScore = (score: Partial<Score>): Score[] => {
  const scores = getScores();
  scores.push({
    ...score,
    timestamp: new Date().toISOString(),
    id: Date.now(),
  } as Score);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  return scores;
};

export const clearScores = (): void => {
  localStorage.removeItem(SCORES_KEY);
};

export const getSettings = (): Settings => {
  const settings = localStorage.getItem(SETTINGS_KEY);
  return settings
    ? JSON.parse(settings)
    : {
        simConnection: {
          type: "simconnect",
          host: "localhost",
          port: 8080,
          autoConnect: false,
        },
        graphics: "medium",
        soundVolume: 50,
        controls: {
          throttle: "W/S",
          rudder: "A/D",
          elevator: "Up/Down",
          aileron: "Left/Right",
        },
      };
};

export const saveSettings = (settings: Settings): Settings => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return settings;
};

export const getSetting = (key: string): any => {
  const settings = getSettings();
  return key.split(".").reduce((obj: any, k) => obj?.[k], settings);
};

export const setSetting = (key: string, value: any): Settings => {
  const settings = getSettings();
  const keys = key.split(".");
  const lastKey = keys.pop();
  if (!lastKey) {
    throw new Error("Invalid setting key");
  }
  const target = keys.reduce((obj: any, k) => {
    if (!obj[k]) obj[k] = {};
    return obj[k];
  }, settings);
  target[lastKey] = value;
  return saveSettings(settings);
};
