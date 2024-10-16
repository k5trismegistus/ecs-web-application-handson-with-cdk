import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from "aws-cdk-lib";

import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";

interface ApplicationStackProps extends StackProps {
  vpc: ec2.Vpc;
  ecrRepository: ecr.Repository;
}

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    const { vpc, ecrRepository } = props;

    const cluster = new ecs.Cluster(this, "EcsHandsOnCluster", {
      vpc: vpc,
      clusterName: "EcsHandsOnCluster",
      enableFargateCapacityProviders: true,
    });

    const taskDefinition = new ecs.TaskDefinition(this, "EcsHandsOnTask", {
      compatibility: ecs.Compatibility.EC2_AND_FARGATE,
      cpu: "256",
      memoryMiB: "512",
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
      },
    });

    const container = taskDefinition.addContainer("EcsHandsOnContainer", {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [
        {
          containerPort: 5000,
        },
      ],
    });

    const albSecurityGroup = new ec2.SecurityGroup(this, "AlbSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic"
    );

    const ecsService = new ecs.FargateService(this, "EcsHandsOnService", {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,

      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE",
          weight: 1,
        },
      ],
    });

    const alb = new elb.ApplicationLoadBalancer(this, "MyALB", {
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        onePerAz: true,
      },
    });

    const targetGroup = new elb.ApplicationTargetGroup(this, "MyTargetGroup", {
      vpc,
      port: 5000,
      protocol: elb.ApplicationProtocol.HTTP,
      targets: [ecsService],
    });

    alb.addListener("Listener", {
      port: 80,
      defaultAction: elb.ListenerAction.forward([targetGroup]),
    });

    const autoScaling = ecsService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });
    autoScaling.scaleOnRequestCount("RequestScaling", {
      requestsPerTarget: 1000,
      targetGroup,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(10),
    });
  }
}
