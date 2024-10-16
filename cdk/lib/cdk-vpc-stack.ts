import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

export class CdkVpcStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "EcsHandsOnVpc", {
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

    const cluster = new ecs.Cluster(this, "EcsHandsOnCluster", {
      vpc: vpc,
      clusterName: "EcsHandsOnCluster",
      enableFargateCapacityProviders: true,
    });

    const ecrRepository = new ecr.Repository(this, "EcsHandsOnRepository", {
      repositoryName: "ecs_handson_repository",

      // To remove the repository when the stack is deleted, you must explicitly set the removal policy to DESTROY
      removalPolicy: RemovalPolicy.DESTROY,
      // To remove the repository when the stack is deleted even if it has images,
      // you must explicitly set the removal policy to DESTROY and set the emptyOnDelete property to true
      emptyOnDelete: true,
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
