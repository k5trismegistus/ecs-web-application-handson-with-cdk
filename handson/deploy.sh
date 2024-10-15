#! /bin/bash
AWS_ACCOUNT_ID=$(aws --profile personal sts get-caller-identity --query "Account" --output text)

# ECR レジストリにログインする
aws ecr get-login-password --profile personal --region us-west-2 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com
# コンテナイメージをビルドする
docker build -t ecs_handson_repository .
# コンテナイメージにタグを付与する
docker tag ecs_handson_repository:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/ecs_handson_repository:latest
# タグを付与したコンテナイメージを ECR に push する
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/ecs_handson_repository:latest
