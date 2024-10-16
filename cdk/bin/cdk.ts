#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { VpcStack } from "../lib/vpc-stack";
import { EcrStack } from "../lib/ecr-stack";
import { ApplicationStack } from "../lib/appliation-stack";

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

const vpcStack = new VpcStack(app, "EcsHandsonVpcStack", {
  description: "VPCStack",
  env: {
    account: account,
    region: region,
  },
});

const ecrStack = new EcrStack(app, "EcsHandsonEcrStack", {
  description: "ECRStack",
  env: {
    account: account,
    region: region,
  },
});

const applicationStack = new ApplicationStack(
  app,
  "EcsHandsonApplicationStack",
  {
    description: "ApplicationStack",
    env: {
      account: account,
      region: region,
    },
    vpc: vpcStack.vpc,
    ecrRepository: ecrStack.ecrRepository,
  }
);
