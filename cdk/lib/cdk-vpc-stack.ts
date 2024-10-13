import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

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

    const ecsSecurityGroup = new ec2.SecurityGroup(this, "EcsSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic"
    );

    const clusterRole = new iam.Role(this, "MyRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "My EC2 role",
    });

    const cluster = new ecs.Cluster(this, "EcsHandsOnCluster", {
      vpc: vpc,
      clusterName: "EcsHandsOnCluster",
      enableFargateCapacityProviders: true,
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, "EcsASG", {
      vpc,

      // If you are using an ARM-based computer (e.g. Apple Silicon based Mac),
      // it is recommended to use the arm based instance type like t4g.
      // And you need to specify the machine image as ecs.AmiHardwareType.ARM
      instanceType: new ec2.InstanceType("t4g.small"),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2023(
        ecs.AmiHardwareType.ARM
      ),
      minCapacity: 1,
      maxCapacity: 1,
      // Setting subnetType public will automatically select all public subnets for this ASG
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ecsSecurityGroup,
      role: clusterRole,
    });

    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      "EcsAsgCapacityProvider",
      {
        autoScalingGroup,
      }
    );

    cluster.addAsgCapacityProvider(capacityProvider);

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

    const ecsService = new ecs.Ec2Service(this, "MyEc2Service", {
      cluster,
      taskDefinition,
      desiredCount: 2,
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
  }
}
