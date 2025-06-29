import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // a-la-Jest globals
    globals: true,
    environment: 'node',
    // Add @vitest/coverage-v8 to devDependencies to support coverage
    // coverage: {
    //   reporter: ['text', 'json', 'html'],
    // },
  },
})
