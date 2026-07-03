import { CicRpcServer } from "../cic_rpc_router";
import { CicTransport } from "../extension_skeleton";

describe("CIC ↔ VS Code WebSocket Transport Protocol Tests", () => {
  let server: CicRpcServer;
  let client: CicTransport;
  const TEST_PORT = 8521;
  const TEST_URL = `ws://127.0.0.1:${TEST_PORT}`;

  beforeAll((done) => {
    // 1. Start the server on our dedicated test port
    server = new CicRpcServer(TEST_PORT);
    // Give the server 100ms to spin up
    setTimeout(done, 100);
  });

  afterAll(async () => {
    // Clean up server resources
    const wss = (server as any).wss;
    if (wss) {
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
    }
  });

  beforeEach(() => {
    client = new CicTransport(TEST_URL);
  });

  afterEach(() => {
    // Close client connection if open
    const ws = (client as any).ws;
    if (ws && ws.readyState === ws.OPEN) {
      ws.close();
    }
  });

  test("Client can connect and complete rpc/hello handshake", async () => {
    const handshakePromise = new Promise<void>((resolve, reject) => {
      // Intercept the welcome message from server
      (client as any).dispatchNotification = (req: any) => {
        if (req.method === "rpc/welcome") {
          expect(req.params.server).toBe("cic-daemon");
          expect(req.params.version).toBe("1.0.0");
          resolve();
        }
      };
    });

    await client.connect();
    await handshakePromise;
  }, 10000);

  test("Client can create a session", async () => {
    await client.connect();
    
    const response = await client.sendRequest<{ sessionId: string }>("session/create", {
      agentId: "cic.agents.retrieval.harvester",
      workspaceRoot: "/mock/workspace"
    });

    expect(response).toBeDefined();
    expect(response.sessionId).toMatch(/^cic-/);
  });

  test("Client can submit a task and receive notifications", async () => {
    await client.connect();
    
    // Create session
    const sessionRes = await client.sendRequest<{ sessionId: string }>("session/create", {
      agentId: "cic.agents.retrieval.harvester",
      workspaceRoot: "/mock/workspace"
    });

    const sessionId = sessionRes.sessionId;
    const receivedPhases: string[] = [];

    // Intercept transition notifications
    const transitionPromise = new Promise<void>((resolve) => {
      (client as any).dispatchNotification = (req: any) => {
        if (req.method === "notification/phase/transition") {
          receivedPhases.push(req.params.currentPhase);
          if (req.params.currentPhase === "emit") {
            resolve();
          }
        }
      };
    });

    // Submit prompt
    const submitRes = await client.sendRequest<{ invocationId: string }>("session/submit", {
      sessionId,
      prompt: "Extract failures"
    });

    expect(submitRes.invocationId).toBeDefined();
    
    // Wait for the async pipeline to complete "emit" phase
    await transitionPromise;
    expect(receivedPhases).toContain("validate");
    expect(receivedPhases).toContain("plan");
    expect(receivedPhases).toContain("execute");
    expect(receivedPhases).toContain("review");
    expect(receivedPhases).toContain("emit");
  }, 15000);

  test("Ping request returns current timestamp", async () => {
    await client.connect();
    const response = await client.sendRequest<{ timestamp: number }>("ping");
    expect(response.timestamp).toBeDefined();
    expect(typeof response.timestamp).toBe("number");
  });
});
