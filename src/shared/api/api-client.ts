import { create } from 'axios';

export const API = create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL}/api`,
  timeout: 40 * 1000,
});
