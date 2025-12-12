import { Service } from "typedi";
import type { DynamicStructuredTool } from "@langchain/core/tools";

/**
 * Central registry for all LangChain tools available to AI agents.
 *
 * This service manages the lifecycle and provides access to all tools
 * that can be used by LangChain agents and chains. It follows the
 * Service Locator pattern with dependency injection.
 *
 * Architecture Notes:
 * - Uses TypeDI for dependency management
 * - Lazy initialization of tools to avoid unnecessary resource allocation
 * - Provides methods to get all tools or filter by specific names
 * - Tools are created on-demand and cached
 */
@Service()
export class ToolRegistry {
  constructor() {
    // Add more tool dependencies here as they are created
  }

  /**
   * Returns all available tools for use with LangChain agents.
   *
   * @returns Array of all registered LangChain tools
   */
  getAllTools(): DynamicStructuredTool[] {
    return [
      // Add more tools here as they are created
    ];
  }

  /**
   * Returns a filtered subset of tools by their names.
   *
   * Useful when you want to provide specific tools to an agent
   * rather than all available tools.
   *
   * @param names - Array of tool names to retrieve
   * @returns Array of tools matching the specified names
   *
   * @example
   * ```typescript
   * const tools = toolRegistry.getToolsByName(['football_player_stats_search']);
   * ```
   */
  getToolsByName(names: string[]): DynamicStructuredTool[] {
    const allTools = this.getAllTools();
    return allTools.filter((tool) => names.includes(tool.name));
  }

  /**
   * Returns the names of all available tools.
   *
   * Useful for debugging or displaying available capabilities.
   *
   * @returns Array of tool names
   */
  getAvailableToolNames(): string[] {
    return this.getAllTools().map((tool) => tool.name);
  }

  /**
   * Gets a specific tool by name.
   *
   * @param name - The name of the tool to retrieve
   * @returns The tool if found, undefined otherwise
   */
  getToolByName(name: string): DynamicStructuredTool | undefined {
    return this.getAllTools().find((tool) => tool.name === name);
  }

  /**
   * Resets all tools, forcing re-initialization on next access.
   * Useful for testing or when configuration changes.
   */
  reset(): void {
    // Add reset calls for other tools as they are created
  }
}
