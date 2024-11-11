// tools.js
const TOOL_RUN_PYTHON_SCRIPT = {
  name: "run_python_script",
  description: "Execute a Python script inside a Docker container.",
  parameters: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "The Python code to execute.",
      },
    },
    required: ["code"],
  },
};

const TOOL_LIST_FILES = {
  name: "list_files",
  description: "List files in a directory.",
  parameters: {
    type: "object",
    properties: {
      directory: {
        type: "string",
        description: "The directory to list files from.",
        default: ".",
      },
    },
    required: [],
  },
};

const TOOL_READ_FILE = {
  name: "read_file",
  description: "Read the contents of a file.",
  parameters: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "The path to the file to read.",
      },
    },
    required: ["file_path"],
  },
};

export default {
  TOOL_RUN_PYTHON_SCRIPT,
  TOOL_LIST_FILES,
  TOOL_READ_FILE,
};
