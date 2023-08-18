/* eslint-disable no-async-promise-executor */
// Import required modules and classes
import config from "@mongez/config";
import { ensureDirectory, extension, fileSize, touch } from "@mongez/fs";
import { log } from "@mongez/logger";
import { Random } from "@mongez/reinforcements";
import dayjs from "dayjs";
import fs from "fs";
import { Upload } from "../models";
import { Request, Response, UploadedFile } from "./../../../http";
import { Image } from "./../../../image";
import { uploadsPath } from "./../../../utils";

// Use a Map to store the chunked file queues
const queuesList = new Map<string, ChunkedFileQueue>();

const maxTimeToClearQueue = 1000 * 60 * 60 * 24; // 24 hours

// Create a function that auto clear the queue list after the queue creation with one date
function cleanupQueuesList() {
  // use interval
  setInterval(() => {
    // make sure only the queue that created before one day will be deleted
    queuesList.forEach((queue, key) => {
      if (queue.createdAt < Date.now() - maxTimeToClearQueue) {
        queuesList.delete(key);
      }
    });
  }, maxTimeToClearQueue);
}

// Clear the queue list every 24 hours
cleanupQueuesList();

export async function uploadChunkedFiles(request: Request, response: Response) {
  try {
    // Extract input data from the request
    const fileId = request.input("fileId");
    const chunkNumber = request.int("chunkNumber");
    const chunkFile = request.file("chunk") as UploadedFile | null;
    const fileName = request.input("fileName");

    if (!chunkFile) {
      return response.badRequest({
        error: "chunk field is required",
      });
    }

    log.info(
      "upload",
      "chunking",
      `Received chunk ${chunkNumber + 1} of ${request.int(
        "totalChunks",
      )} (${request.int("currentChunkSize")} / ${request.number(
        "chunkSize",
      )}) ${fileId}`,
    );

    // Create the file directory if it doesn't exist
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

      // Create a new queue for this file
      const queue = new ChunkedFileQueue(
        uploadsPath(fileDirectoryPath) + "/" + fileName,
        request.int("totalChunks"),
      );

      queuesList.set(fileId, queue);
    }

    const queue = queuesList.get(fileId) as ChunkedFileQueue;

    // Add the chunk to the queue
    await queue.append({
      chunk: chunkFile,
      chunkNumber,
    });

    // Process the last chunk
    if (request.int("totalChunks") === chunkNumber + 1) {
      await queue.process();

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

      // Remove the queue from the list after processing
      queuesList.delete(fileId);

      return response.success({
        upload,
      });
    }

    response.success();
  } catch (error) {
    log.error(
      "upload",
      "chunking",
      "Error occurred while processing chunk:",
      error,
    );
    return response.serverError({
      message: "An error occurred while processing the chunk",
      error,
    });
  }
}

// Create a queue class that receives the chunks and append them to the file
class ChunkedFileQueue {
  /**
   * Creation Time
   */
  public readonly createdAt = Date.now();

  /**
   * The queue
   */
  private queue: {
    chunk: Buffer;
    chunkNumber: any;
  }[] = [];

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
   * Append a chunk to the queue
   */
  public async append(chunk: { chunk: UploadedFile; chunkNumber: number }) {
    const buffer = await chunk.chunk.buffer();
    this.queue.push({
      chunk: buffer,
      chunkNumber: chunk.chunkNumber,
    });
  }

  /**
   * Create the file and append all chunks to it
   * This method will be called only when the queue is full
   * and all chunks are received correctly
   * @private
   */
  private async createFile() {
    // Sort the queue by chunk number so we can append them in the right order

    const queue = [...this.queue].sort((a, b) => a.chunkNumber - b.chunkNumber);

    const singleBuffer = Buffer.concat(queue.map(chunk => chunk.chunk));

    await fs.promises.writeFile(this.filePath, singleBuffer);
  }

  /**
   * Process the chunks and create the file when all chunks are received
   * @returns {Promise<void>}
   */
  public process(): Promise<void> {
    return new Promise(resolve => {
      // Check if all chunks have been received
      if (this.queue.length < this.totalChunks) {
        log.info(
          "upload",
          "chunked",
          `Waiting for all chunks to be received... (Received: ${this.queue.length}, Total: ${this.totalChunks})`,
        );

        // Retry after a short delay
        setTimeout(() => {
          this.process().then(resolve);
        }, 100);
        return;
      }

      // Now create the file and resolve the Promise when done
      this.createFile().then(() => {
        resolve();
      });
    });
  }
}
