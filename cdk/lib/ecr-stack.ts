import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as ecr from "aws-cdk-lib/aws-ecr";

export class EcrStack extends Stack {
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.ecrRepository = new ecr.Repository(this, "EcsHandsOnRepository", {
      repositoryName: "ecs_handson_repository",

      // To remove the repository when the stack is deleted, you must explicitly set the removal policy to DESTROY
      removalPolicy: RemovalPolicy.DESTROY,
      // To remove the repository when the stack is deleted even if it has images,
      // you must explicitly set the removal policy to DESTROY and set the emptyOnDelete property to true
      emptyOnDelete: true,
    });
  }
}
