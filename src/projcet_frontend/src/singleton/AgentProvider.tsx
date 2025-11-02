import React, { createContext, useContext } from "react";
import { agentService } from "./agentService";
import type { HttpAgent } from "@dfinity/agent";

interface AgentContextType {
    getAgent: () => Promise<HttpAgent>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <AgentContext.Provider value={{ getAgent: agentService.getAgent.bind(agentService) }}>
            {children}
        </AgentContext.Provider>
    );
};

export const useAgent = (): AgentContextType => {
    const context = useContext(AgentContext);
    if (!context) {
        throw new Error("useAgent must be used within AgentProvider");
    }
    return context;
};
