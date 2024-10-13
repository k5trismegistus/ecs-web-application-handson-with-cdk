import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
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
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, "EcsSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    // 必要なポートを開放（例としてHTTPポート80を開放）
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
      instanceType: new ec2.InstanceType("t3.medium"), // 必要に応じてインスタンスタイプを選択
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(), // ECS最適化AMI
      minCapacity: 1,
      maxCapacity: 1,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // AutoScalingGroupを配置するサブネットのタイプ
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

    });
  }
}
