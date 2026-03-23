import path from "node:path";

export default {
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
};
