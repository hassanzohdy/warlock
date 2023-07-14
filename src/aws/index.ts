import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { log } from "@mongez/logger";
import fs from "fs";

export type AWSConnectionOptions = {
  endpointUrl: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
} & Partial<S3ClientConfig>;

export type AWSConfigurations = {
  parseFileName?: (options: { fileName: string; hash: string }) => string;
  connectionOptions:
    | AWSConnectionOptions
    | (() => Promise<AWSConnectionOptions>);
};

export type AWSUploadOptions = {
  filePath: string;
  fileName: string;
  hash: string;
  mimeType: string;
} & AWSConfigurations;

export async function uploadToAWS({
  filePath,
  fileName,
  hash,
  mimeType,
  parseFileName = ({ fileName, hash }) => hash + "-" + fileName,
  connectionOptions,
}: AWSUploadOptions) {
  if (typeof connectionOptions === "function") {
    connectionOptions = await connectionOptions();
  }

  const {
    endpointUrl,
    accessKeyId,
    bucketName,
    secretAccessKey,
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

  const finalFleName = parseFileName({ fileName, hash });

  const bucketParams: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: finalFleName,
    Body: fs.createReadStream(filePath),
    // make it publicly accessible
    ACL: "public-read",
    ContentType: mimeType,
  };

  log(
    "aws",
    "uploading",
    "Uploading " + finalFleName + " to " + bucketName + "...",
    "info",
  );

  try {
    await s3Client.send(new PutObjectCommand(bucketParams));

    log(
      "aws",
      "uploaded",
      "Uploaded " + finalFleName + " to " + bucketName + "...",
      "success",
    );

    // now we have the URL of the uploaded file
    // let's return it
    return `https://feather-cdn.sgp1.digitaloceanspaces.com/${finalFleName}`;
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
