import {
  S3Client,
  PutBucketTaggingCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import { convertCSVToArray } from "convert-csv-to-array";
import * as fs from "fs";

const client = new S3Client({ region: "us-east-1" });
const data = fs.readFileSync("buckets.csv").toString();

console.log(data);

const parseCsv = (csv) => {
  let lines = csv.split(/\r?\n/);
  const header = lines.shift().split(",");
  return lines.map((line) => {
    const bits = line.split(",");
    let obj = {};
    header.forEach((h, i) => (obj[h] = bits[i])); // or use reduce here
    // optional:
    return obj;
  });
};

const newData = parseCsv(data);
console.log(newData);

const arrayofArrays = convertCSVToArray(data, {
  separator: ",", // use the separator you use in your csv (e.g. '\t', ',', ';' ...)
});

const cleanData = arrayofArrays.slice(1);

const listBucket = async () => {
  const command = new ListBucketsCommand({});
  const response = await client.send(command);
  console.log(response);
};

const getFormattedTags = (bucket) => {
  const newBucket = bucket;
  delete bucket.bucketName;
  let arrayOfTags = [];
  for (const property in bucket) {
    arrayOfTags.push({
      Key: property,
      Value: bucket[property],
    });
  }
  console.log(arrayOfTags);
  return arrayOfTags;
};

const tagBucket = async (bucketData) => {
  const Bucket = bucketData.bucketName;
  const formattedTags = getFormattedTags(bucketData);
  const command = new PutBucketTaggingCommand({
    Bucket,
    Tagging: {
      TagSet: formattedTags,
    },
  });
  const response = await client.send(command);
  console.log(response);
};

const tagAllBuckets = async (bucketArray) => {
  for (let bucket of bucketArray) {
    try {
      await tagBucket(bucket);
    } catch (error) {
      console.log(error);
    }
  }
};

tagAllBuckets(newData);
