import config from "@mongez/config";
import { ensureDirectory, extension, fileSize, touch } from "@mongez/fs";
import { log } from "@mongez/logger";
import { Random } from "@mongez/reinforcements";
import dayjs from "dayjs";
import fs from "fs";
import { Image } from "src/warlock/image";
import { Upload } from "../models";
import { Request, Response, UploadedFile } from "./../../../http";
import { uploadsPath } from "./../../../utils";

const queuesList = new Map<string, ChunkedFileQueue>();

export async function uploadChunkedFiles(request: Request, response: Response) {
  const fileId = request.input("fileId");
  const chunkNumber = request.int("chunkNumber");
  const chunkFile = request.file("chunk") as UploadedFile | null;
  const fileName = request.input("fileName");

  log.info(
    "upload",
    "chunking",
    "Received chunk " +
      (chunkNumber + 1) +
      " of " +
      request.int("totalChunks") +
      fileId,
  );

  if (!chunkFile) {
    return response.badRequest({
      error: "chunk is required",
    });
  }

  if (!queuesList.has(fileId)) {
    const date = dayjs().format("DD-MM-YYYY");
    const hash = Random.string(64);
    const defaultDirectoryPath = date + "/" + hash;
    const directoryPath = config.get("uploads.saveTo", defaultDirectoryPath);

    const fileDirectoryPath =
      typeof directoryPath === "function"
        ? directoryPath(defaultDirectoryPath)
        : directoryPath;

    ensureDirectory(uploadsPath(fileDirectoryPath));
    touch(uploadsPath(fileDirectoryPath) + "/" + fileName);

    const queue = new ChunkedFileQueue(
      uploadsPath(fileDirectoryPath) + "/" + fileName,
      request.int("totalChunks"),
    );

    queuesList.set(fileId, queue);
  }

  const queue = queuesList.get(fileId) as ChunkedFileQueue;

  if (request.int("totalChunks") > chunkNumber + 1) {
    response.success();
  }

  // add the chunk to the queue
  queue.append(chunkFile);

  // now check if this is the last chunk
  if (request.int("totalChunks") === chunkNumber + 1) {
    await queue.waitUntilDone();

    const fileData: any = {
      hash: Random.string(64),
      path: queue.filePath.replace(uploadsPath("/"), ""),
      size: fileSize(queue.filePath),
      extension: extension(request.input("fileName")),
      name: request.input("fileName"),
      mimeType: request.input("fileType"),
      chunked: true,
    };

    if (chunkFile.isImage) {
      const { width, height } = await new Image(queue.filePath).dimensions();
      fileData.width = width;
      fileData.height = height;
    }

    const upload = await Upload.create(fileData);

    // remove the queue from the list
    queuesList.delete(fileId);

    return response.success({
      upload,
    });
  }
}

// Create a queue class that receives the chunks and append them to the file
// we need to append them one by one
class ChunkedFileQueue {
  /**
   * The queue
   */
  private queue: any[] = [];

  /**
   * Queue state
   */
  protected state: "idle" | "processing" = "idle";

  /**
   * Total chunks that have been processed
   */
  protected processedChunks = 0;

  /**
   * Constructor
   */
  public constructor(public filePath: string, public totalChunks: number) {
    //
  }

  /**
   * Check if the queue has finished processing all the chunks
   */
  public get isFinished() {
    return this.totalChunks === this.processedChunks;
  }

  /**
   * Wait for the queue to finish processing
   */
  public async waitUntilDone() {
    if (this.isFinished) {
      return;
    }

    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.isFinished) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }

  /**
   * Append a chunk to the queue
   */
  public append(chunk: any) {
    this.queue.push(chunk);

    // now we need to check if the queue state is idle
    if (this.state === "idle") {
      this.process();
    }
  }

  /**
   * Start processing the queue
   */
  public async process() {
    if (this.state === "processing") {
      return;
    }

    // if the queue is empty, then we can stop the process
    if (!this.queue.length) {
      this.state = "idle";
      return;
    }

    log.info(
      "upload",
      "chunking",
      "Processing chunk " +
        (this.processedChunks + 1) +
        " of " +
        this.totalChunks +
        "...",
    );

    // now we need to get the first chunk
    const chunk = this.queue.shift();

    // now we need to append the chunk to the file
    await fs.promises.appendFile(this.filePath, await chunk.buffer());

    // now we need to increase the processed chunks
    this.processedChunks++;

    log.success(
      "upload",
      "chunked",
      "Processed chunk " +
        this.processedChunks +
        " of " +
        this.totalChunks +
        "...",
    );

    // now we need to process the next chunk
    this.process();
  }
}
