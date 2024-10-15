https://catalog.workshops.aws/ecs-web-application-handson/ja-JP

## Build docker image

```
$ cd handson
$ docker build -t ecs-handson-flask-app .
```

## Setup CDK

```
$ npx cdk bootstrap
```

## Deploy

```
# at cdk/
$ npx cdk synth
$ npx cdk deploy
# at handson/
$ ./deploy.sh
```

## Destroy

```
$ npx cdk destroy
```
