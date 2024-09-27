import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class CdkVpcStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "EcsHandsOnVpc", {
      vpcName: "EcsHandsOnVpc",
      subnetConfiguration: [],
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
    });

    const publicSubnetOne = new ec2.PublicSubnet(this, "PublicSubnetOne", {
      availabilityZone: "us-west-2a",
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.0.0/20",
    });

    const publicSubnetTwo = new ec2.PublicSubnet(this, "PublicSubnetTwo", {
      availabilityZone: "us-west-2b",
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.16.0/20",
    });
  }
}
