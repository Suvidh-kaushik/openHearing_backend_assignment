import { afterAll, afterEach, beforeAll } from "vitest";

const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = () => {};
  console.log = () => {};
});

afterEach(() => {
  
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});


