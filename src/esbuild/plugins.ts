import { getJsonFile, putJsonFile } from "@mongez/fs";
import { ChildProcess, spawn } from "child_process";
import type { PluginBuild } from "esbuild";
import { warlockPath } from "./../utils";

// Keep track of the active server process.
let serverProcess: ChildProcess | null = null;

export const nativeNodeModulesPlugin = {
  name: "native-node-modules",
  setup(build: PluginBuild) {
    // If a ".node" file is imported within a module in the "file" namespace, resolve
    // it to an absolute path and put it into the "node-file" virtual namespace.
    build.onResolve({ filter: /\.node$/, namespace: "file" }, (args: any) => ({
      path: require.resolve(args.path, { paths: [args.resolveDir] }),
      namespace: "node-file",
    }));

    // Files in the "node-file" virtual namespace call "require()" on the
    // path from esbuild of the ".node" file in the output directory.
    build.onLoad({ filter: /.*/, namespace: "node-file" }, (args: any) => ({
      contents: `
        import path from ${JSON.stringify(args.path)}
        try { module.exports = require(path) }
        catch {}
      `,
    }));

    // If a ".node" file is imported within a module in the "node-file" namespace, put
    // it in the "file" namespace where esbuild's default loading behavior will handle
    // it. It is already an absolute path since we resolved it to one above.
    build.onResolve(
      { filter: /\.node$/, namespace: "node-file" },
      (args: any) => ({
        path: args.path,
        namespace: "file",
      }),
    );

    // Tell esbuild's default loading behavior to use the "file" loader for
    // these ".node" files.
    const opts = build.initialOptions;
    opts.loader = opts.loader || {};
    opts.loader[".node"] = "file";
  },
};

// This plugin should start the server whenever a build is done
export const startServerPlugin = {
  name: "start-server",
  setup(build: PluginBuild) {
    build.onEnd(async () => {
      // If there is an existing server process, stop it.
      if (serverProcess) {
        serverProcess.kill(); // You may need to adjust this based on your specific server process.
        serverProcess = null;
      }

      // If there is an existing server process, stop it and its entire process group.
      if (serverProcess !== null) {
        process.kill(-(serverProcess as any).pid); // Negative PID kills the entire process group.
        serverProcess = null;
      }

      // replace the sourceRoot in the http.js.map to be just "/"
      const mapFileContent = getJsonFile(warlockPath("http.js.map"));

      mapFileContent.sourceRoot = "";

      putJsonFile(warlockPath("http.js.map"), mapFileContent);

      // Start a new server process.
      serverProcess = spawn(
        "node",
        ["--enable-source-maps", warlockPath("http.js")],
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );

      // Optionally, you can add error handling for the server process.
      serverProcess.on("error", err => {
        console.error("Server process error:", err);
      });

      // Optionally, you can add an event handler for when the server process exits.
      // serverProcess.on("exit", (code, signal) => {
      //   if (code === 0) {
      //     console.log("Server process exited successfully.");
      //   } else {
      //     console.error(
      //       `Server process exited with code ${code} and signal ${signal}.`,
      //     );
      //   }
      // });
    });
  },
};
