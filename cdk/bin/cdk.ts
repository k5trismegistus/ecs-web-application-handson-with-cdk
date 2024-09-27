#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkVpcStack } from "../lib/cdk-vpc-stack";

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

new CdkVpcStack(app, "CdkVpcStack", {
  description: "VPC",
  env: {
    account: account,
    region: region,
  },
});
