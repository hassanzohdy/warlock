import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { log } from "@mongez/logger";
import fs from "fs";
export * from "./get-aws-configurations";

export type AWSConnectionOptions = {
  endpointUrl: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  providerName: string; // i.e aws | digitalocean
} & Partial<S3ClientConfig>;

export type AWSConfigurations = {
  parseFileName?: (options: { fileName: string; hash: string }) => string;
  connectionOptions:
    | AWSConnectionOptions
    | (() => Promise<AWSConnectionOptions>);
};

export type AWSUploadOptions = {
  filePath?: string;
  fileBuffer?: Buffer;
  fileName: string;
  hash: string;
  mimeType: string;
  isCachedFile?: boolean;
} & AWSConfigurations;

export async function createAWSClient(
  connectionOptions: AWSConfigurations["connectionOptions"],
) {
  if (typeof connectionOptions === "function") {
    connectionOptions = await connectionOptions();
  }

  const {
    endpointUrl,
    accessKeyId,
    bucketName,
    secretAccessKey,
    providerName,
    region = "us-east-1",
    ...clientOptions
  } = connectionOptions;

  // Step 2: The s3Client function validates your request and directs it to your Space's specified endpoint using the AWS SDK.
  const s3Client = new S3Client({
    endpoint: endpointUrl, // Find your endpoint in the control panel, under Settings. Prepend "https://".
    forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey, // Secret access key defined through an environment variable.
    },
    ...clientOptions,
  });

  return {
    client: s3Client,
    bucketName,
    providerName,
    endpointUrl,
    region,
  };
}

export async function uploadToAWS({
  filePath,
  fileBuffer,
  fileName,
  hash,
  mimeType,
  isCachedFile = false,
  parseFileName = ({ fileName, hash }) => hash + "-" + fileName,
  connectionOptions,
}: AWSUploadOptions) {
  const finalFleName =
    (isCachedFile ? "cache/" : "") + parseFileName({ fileName, hash });

  const { client, bucketName, endpointUrl, providerName, region } =
    await createAWSClient(connectionOptions);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: finalFleName,
    Body: fileBuffer || fs.createReadStream(filePath as string),
    // make it publicly accessible
    ACL: "public-read",
    ContentType: mimeType,
  });

  log(
    "aws",
    "uploading",
    "Uploading " + finalFleName + " to " + bucketName + "...",
    "info",
  );

  try {
    await client.send(command);

    log(
      "aws",
      "uploaded",
      "Uploaded " + finalFleName + " to " + bucketName + "...",
      "success",
    );

    // now we have the URL of the uploaded file
    // let's return it
    const providerUrl = endpointUrl.replace(/^https?:\/\//, "");

    return {
      path: providerUrl,
      name: providerName,
      bucket: bucketName,
      region,
      fileName: finalFleName,
      url: `https://${bucketName}.${providerUrl}/${finalFleName}`,
    };
  } catch (err) {
    console.log("Error", err);
    log(
      "aws",
      "error",
      "Error uploading " + finalFleName + " to " + bucketName + "...",
      "error",
    );
  }
}

export async function deleteFromAWS({
  fileName,
  connectionOptions,
}: {
  fileName: string;
  connectionOptions: AWSConfigurations["connectionOptions"];
}) {
  const { client, bucketName } = await createAWSClient(connectionOptions);

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  log(
    "aws",
    "deleting",
    "Deleting " + fileName + " from " + bucketName + "...",
    "info",
  );

  try {
    await client.send(command);

    log(
      "aws",
      "deleted",
      "Deleted " + fileName + " from " + bucketName + "...",
      "success",
    );
  } catch (err) {
    console.log("Error", err);
    log("aws", "deleting", err, "error");
  }
}

export async function downloadFromAWS({
  fileName,
  connectionOptions,
}: {
  fileName: string;
  connectionOptions: AWSConfigurations["connectionOptions"];
}) {
  const { client, bucketName } = await createAWSClient(connectionOptions);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  log(
    "aws",
    "downloading",
    "Downloading " + fileName + " from " + bucketName + "...",
    "info",
  );

  try {
    const content = await client.send(command);

    log(
      "aws",
      "downloaded",
      "Downloaded " + fileName + " from " + bucketName + "...",
      "success",
    );

    return content.Body?.transformToByteArray();
  } catch (err) {
    console.log("Error", err);
    log("aws", "downloading", err, "error");
  }
}

export async function streamFromAWS({
  fileName,
  connectionOptions,
  start,
  end,
}: {
  fileName: string;
  connectionOptions: AWSConfigurations["connectionOptions"];
  start: number;
  end: number;
}) {
  const { client, bucketName } = await createAWSClient(connectionOptions);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Range: `bytes=${start}-${end}`,
  });

  log(
    "aws",
    "streaming",
    "Streaming " + fileName + " from " + bucketName + "...",
    "info",
  );

  try {
    const content = await client.send(command);

    log(
      "aws",
      "streamed",
      "Streamed " + fileName + " from " + bucketName + "...",
      "success",
    );

    return content.Body?.transformToByteArray();
  } catch (err) {
    console.log("Error", err);
    log("aws", "streaming", err, "error");
  }
}
