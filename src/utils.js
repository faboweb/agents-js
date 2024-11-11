// utils.js
function parseResponse(response, ledger) {
  const lines = response.split("\n");
  lines.forEach((line) => {
    if (line.startsWith("Task:")) {
      const task = line.replace("Task:", "").trim();
      ledger.addTask(task);
    }
  });
}

function parseCodeBlocks(text) {
  const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;
  while ((match = codeBlockPattern.exec(text)) !== null) {
    const language = match[1] || "";
    const code = match[2];
    codeBlocks.push({ language, code });
  }
  return codeBlocks;
}

export default { parseResponse, parseCodeBlocks };
