import { describe, it, expect, beforeAll } from "vitest";
import { initAllTools } from "../src/tools/index.js";
import { getAllTools, executeTool } from "../src/core/registry.js";

describe("Unified Tool Engine", () => {
  beforeAll(() => {
    initAllTools();
  });

  it("registers all 17 developer tools", () => {
    const tools = getAllTools();
    expect(tools.length).toBeGreaterThanOrEqual(15);

    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("get_active_project");
    expect(toolNames).toContain("get_project_info");
    expect(toolNames).toContain("read_file");
    expect(toolNames).toContain("edit_file");
    expect(toolNames).toContain("patch_file");
    expect(toolNames).toContain("list_files");
    expect(toolNames).toContain("delete_file");
    expect(toolNames).toContain("move_file");
    expect(toolNames).toContain("restore_backup");
    expect(toolNames).toContain("search_files");
    expect(toolNames).toContain("check_port");
    expect(toolNames).toContain("view_page");
    expect(toolNames).toContain("get_api_response");
    expect(toolNames).toContain("run_command");
    expect(toolNames).toContain("get_git_status");
    expect(toolNames).toContain("get_git_diff");
    expect(toolNames).toContain("scan_dev_servers");
  });

  it("executes get_active_project correctly", async () => {
    const res = await executeTool("get_active_project", {});
    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toContain("ACTIVE PROJECT");
    expect(res.content[0].text).toContain("universal-dev-mcp");
  });

  it("executes read_file for package.json", async () => {
    const res = await executeTool("read_file", { filepath: "package.json", start_line: 1, end_line: 5 });
    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toContain("package.json");
    expect(res.content[0].text).toContain("universal-dev-mcp");
  });

  it("executes get_git_status correctly", async () => {
    const res = await executeTool("get_git_status", {});
    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toContain("Git Repository Status");
  });

  it("safely handles unknown tool execution", async () => {
    const res = await executeTool("non_existent_tool", {});
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Unknown tool: "non_existent_tool"');
  });
});
