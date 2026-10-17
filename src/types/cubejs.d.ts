// Minimal types for the parts of the cubejs package we use (Kociemba two-phase solver).
declare module "cubejs" {
  interface CubeInstance {
    solve(maxDepth?: number): string;
  }
  const Cube: {
    initSolver(): void;
    fromString(facelets: string): CubeInstance;
  };
  export default Cube;
}
