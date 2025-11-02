import { HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";

class AgentService {
  private authClientInstance: AuthClient | null = null;
  private agentInstance: HttpAgent | null = null;

  async getAuthClient(): Promise<AuthClient> {
    if (!this.authClientInstance) {
      this.authClientInstance = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 60 * 8, // 8 hours instead of 30 minutes
          disableDefaultIdleCallback: true,
        },
      });
    }
    return this.authClientInstance;
  }

  async getAgent(): Promise<HttpAgent> {
    if (!this.agentInstance) {
      const client = await this.getAuthClient();
      this.agentInstance = new HttpAgent({
        identity: client.getIdentity(),
      });

      if (process.env.DFX_NETWORK === "local") {
        await this.agentInstance.fetchRootKey();
      }

    //   console.log("Agent created");
    } else {
    //   console.log("Agent reused");
    }
    return this.agentInstance;
  }
}

// Singleton instance
const globalForAgent = globalThis as unknown as { agentService?: AgentService };
export const agentService = globalForAgent.agentService ?? new AgentService();
if (!globalForAgent.agentService) globalForAgent.agentService = agentService;
