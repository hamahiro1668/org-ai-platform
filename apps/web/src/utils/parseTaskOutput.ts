// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseOutputJson(output?: string): any | null {
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch {
    // Try to extract JSON from markdown code block
    const match = output.match(/```json\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch { /* skip */ }
    }
    return null;
  }
}
