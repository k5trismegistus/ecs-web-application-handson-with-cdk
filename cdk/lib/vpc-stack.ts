import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as ec2 from "aws-cdk-lib/aws-ec2";

export class VpcStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "EcsHandsOnVpc", {
      vpcName: "EcsHandsOnVpc",
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public1",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Public2",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      // To avoid the subnets being created in the same AZ, specify the maxAzs property
      maxAzs: 2,
    });
  }
}
